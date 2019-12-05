/*
 * # js-address-lookup.js
 * Auto complete addresses as the user types. Save the output to individual fields.
 */
document.addEventListener('DOMContentLoaded', function(){
	(function(){

		// Settings - Remove the // and edit these as needed
		var options = {
			googleCloudAPIKey: 'AIzaSyBVrqGDBqE85jvuaOO6-bXBTywbfCzoET0',
			lookupFieldWrapperClassName: 'jls-address-lookup',
			lookupFieldWrapperHiddenClassName: 'jls-address-lookup--hidden',
			lookupFieldEditLinkClassName: 'jls-address-lookup__manual-link',
			lookupFieldClassName: 'jls-address-lookup__field',
			manualFieldsClassName: 'jls-manual-address',
			manualFieldsHiddenClassName: 'jls-manual-address--hidden',
			addressPreviewClassName: 'jls-address-preview',
			addressPreviewContentClassName: 'jls-address-preview__content',
			addressPreviewHiddenClassName: 'jls-address-preview--hidden',
			manualFieldNames: {
				address_line_1: 'address_line_1',
				address_line_2: 'address_line_2',
				city: 'city',
				county: 'county',
				postcode: 'postcode',
				country: 'country'
			}
		};


		// #############################################################################
		// Do not edit below this line
		var googleAutoComplete, googlePlaceSearch;
		var lookupFieldEditLink = document.getElementsByClassName(options.lookupFieldEditLinkClassName);
		var lookupFieldWrapper = document.getElementsByClassName(options.lookupFieldWrapperClassName)[0];
		var lookupField = document.getElementsByClassName(options.lookupFieldClassName)[0];
		var addressPreview = document.getElementsByClassName(options.addressPreviewClassName)[0];
		var addressPreviewContent = addressPreview.getElementsByClassName(options.addressPreviewContentClassName)[0];
		var manualAddressFields = document.getElementsByClassName(options.manualFieldsHiddenClassName)[0];

		var initGoogle = function(){
			(function(d, script) {
			    script = d.createElement('script');
			    script.type = 'text/javascript';
			    script.async = true;
			    script.onload = function(){
			        // remote script has loaded
			    };
			    script.src = 'https://maps.googleapis.com/maps/api/js?key='+ options.googleCloudAPIKey +'&libraries=places&callback=';
			    d.getElementsByTagName('body')[0].appendChild(script);
			}(document));
		}

		var init = function(){
			lookupField.addEventListener("focus", initAutocomplete);
			addEventListenerOnEach(lookupFieldEditLink, "click", showManual);
			initGoogle();
		}

		var addEventListenerOnEach = function(els, e, f){
			for (var i = 0; i < els.length; i++) {
				els[i].addEventListener(e, f);
			}
		}

		var initAutocomplete = function(){

			googleAutoComplete = new google.maps.places.Autocomplete(
				lookupField,
				{types: ['geocode', 'establishment']}
			);

			googleAutoComplete.setFields(['address_component', 'formatted_address', 'name', 'type']);
			googleAutoComplete.addListener('place_changed', addressSelected);

		}

		var showManualAddressFields = function(){
			manualAddressFields.classList.remove(options.manualFieldsHiddenClassName);
		}

		var hideManualAddressFields = function(){
			manualAddressFields.classList.add(options.manualFieldsHiddenClassName);
		}

		var showAddressPreview = function(){
			addressPreview.classList.remove(options.addressPreviewHiddenClassName);
		}

		var hideAddressPreview = function(){
			addressPreview.classList.add(options.addressPreviewHiddenClassName);
		}

		var showLookupFieldWrapper = function(){
			lookupFieldWrapper.classList.remove(options.lookupFieldWrapperHiddenClassName);
		}

		var hideLookupFieldWrapper = function(){
			lookupFieldWrapper.classList.add(options.lookupFieldWrapperHiddenClassName);
		}

		var showManual = function(){
			hideAddressPreview();
			hideLookupFieldWrapper();
			showManualAddressFields();
		}

		var hideManual = function(){
			showAddressPreview();
			showLookupFieldWrapper();
			hideManualAddressFields();
		}

		var populateAddressPreview = function(){
			var address = populatedAddressString();
			addressPreviewContent.textContent = address;
		}

		var populatedAddressString = function(){
			var address = '';
			var address_line_1 = document.getElementsByName(options.manualFieldNames.address_line_1)[0].value;
			var address_line_2 = document.getElementsByName(options.manualFieldNames.address_line_2)[0].value;
			var city = document.getElementsByName(options.manualFieldNames.city)[0].value;
			var county = document.getElementsByName(options.manualFieldNames.county)[0].value;
			var postcode = document.getElementsByName(options.manualFieldNames.postcode)[0].value;
			var country = document.getElementsByName(options.manualFieldNames.country)[0].value;

			address += (address_line_1 != '')? address_line_1 + ', ' : '';
			address += (address_line_2 != '')? address_line_2 + ', ' : '';
			address += (city != '')? city + ', ' : '';
			address += (county != '')? county + ', ' : '';
			address += (postcode != '')? postcode + ', ' : '';
			address += (country != '')? country : '';

			return address;
		}

		// Add the selected address to hidden fields
		var addressSelected = function(){
			var selectedPlace = googleAutoComplete.getPlace();
			populateFields(parsePlaceToAddress(selectedPlace));
			populateAddressPreview();
			showAddressPreview();
			hideLookupFieldWrapper();
		}

		var parsePlaceToAddress = function(place){
			var address_components = place.address_components;
			var result = {
				raw: {
					"country": {
						"code": "",
						"name": ""
					}
				},
				formatted: {
					"formatted": "",
					"address_line_1": "",
					"address_line_2": "",
					"city": "",
					"county": "",
					"postcode": "",
					"country": {
						"code": "",
						"name": ""
					},
				}
			};

			// Create a raw version
			for (var i = 0; i < address_components.length; i++) {
				var item = address_components[i];
				if(item.types[0] == 'country'){
					result.raw[item.types[0]].name = item.long_name;
					result.raw[item.types[0]].code = item.short_name;
				}
				else result.raw[item.types[0]] = item.long_name;
			}

			/*
				Weight
				City
					- postal_town
					- locality
				Address Line 2
					- sublocality_level_1
					- locality (if not used)
			*/

			// Used values
			var hasAddressLine2 = false;
			var hasCity = false;

			// Assign raw to formatted
			for (var key in result.raw) {
				if (result.raw.hasOwnProperty(key)) {
					var value = result.raw[key];

					// Address Line 1
					if(key == 'street_number'){
						result.formatted.address_line_1 += value + ' ';
					}
					if(key == 'route'){
						result.formatted.address_line_1 += value;
					}

					// Sublocality
					if(key == 'sublocality_level_1' && !hasAddressLine2){
						result.formatted.address_line_2 = value;
						hasAddressLine2 = true;
					}

					// Locality
					if(key == 'locality'){
						if(!hasAddressLine2) result.formatted.address_line_2 = value;
						if(!hasCity) result.formatted.city = value;
						hasAddressLine2 = true;
					}

					// Town/City
					if(key == 'postal_town'){
						result.formatted.city = value;
						hasCity = true;
					}

					// Country
					if(key == 'country'){
						result.formatted.country = value;
					}

					// County
					if(result.raw.country.code == 'US'){
						if(key == 'administrative_area_level_1'){
							result.formatted.county = value;
						}
					}
					else {
						if(key == 'administrative_area_level_2'){
							result.formatted.county = value;
						}
					}

					// Postcode
					if(key == 'postal_code'){
						result.formatted.postcode = value;
					}
				}
			}

			// Business Name Parsing
			var isBusinessAddress = false;
			var placeTypes = place.types;
			var placeName = place.name;
			if(placeTypes.includes("establishment")){
				result.formatted.address_line_1 = placeName + ', ' + result.formatted.address_line_1;
			}

			// Formatted from Google
			result.formatted.formatted = place.formatted_address;

			return result;
		}

		// Parse place to address object
		var parsePlaceToAddressV1 = function(place){
			var result = {
				"formatted": "",
				"address_line_1": " ",
				"address_line_2": "",
				"city": "",
				"county": "",
				"postcode": "",
				"country": {
					"code": "",
					"name": ""
				},
			};

			// Place type
			var placeTypes = place.types;
			var isBusinessAddress = false;
			var placeName = place.name;
			if(placeTypes.includes("establishment")) isBusinessAddress = true;

			if(isBusinessAddress) result['address_line_1'] = result['address_line_1'] + placeName + ', ';

			var components = place.address_components;
			for (var i = 0; i < place.address_components.length; i++) {
				var type = place.address_components[i].types[0];
				var value = place.address_components[i];

				switch (type) {
					case 'street_number':
						result['address_line_1'] = result['address_line_1'] + value.long_name + result['address_line_1'];
						break;
					case 'route':
						result['address_line_1'] = result['address_line_1'] + value.long_name;
						break;
					case 'locality':
						result['address_line_2'] = value.long_name;
						break;
					case 'postal_town':
						result['city'] = value.long_name;
						break;
					case 'administrative_area_level_2':
						result['county'] = value.long_name;
						break;
					case 'country':
						result['country']['name'] = value.long_name;
						result['country']['code'] = value.short_name;
						break;
					case 'postal_code':
						result['postcode'] = value.long_name;
						break;
					default:

				}
			}

			result['formatted'] = place.formatted_address;

			return result;

		}

		// Fill in fields
		var populateFields = function(place){

			for (var key in options.manualFieldNames) {
				if (options.manualFieldNames.hasOwnProperty(key)) {
					var field = document.getElementsByName(options.manualFieldNames[key])[0];
					var value = place.formatted[key];

					if(typeof field !== 'undefined'){
						if(key == 'country'){
							field.value = value.code;
						}
						else {
							field.value = value;
						}
					}
				}
			}
		}

		init(); // Run

	})();
});
