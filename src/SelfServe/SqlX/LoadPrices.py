''' Imports '''
import json
from pprint import pprint

import requests

''' Constants '''
PRICE_API_DEDICATED_GATEWAY_ENDPOINT = "https://prices.azure.com:443/api/retail/prices?$filter=productName eq 'Azure Cosmos DB Dedicated Gateway - General Purpose'"
ITEMS = "Items"
ARM_REGION_NAME = "armRegionName"
SKU_NAME = "skuName"
RETAIL_PRICE = "retailPrice"
NEXT_PAGE_LINK = "NextPageLink"
PRICE_MAPPING_JSON_FILE = "SqlxPriceMapping.json"

''' Helper Functions '''
# Parses Price API response as dictionary of dictionaries: mapping region -> sku -> price


def parsePriceApiResponse(priceApiResponse):
    newPriceMapping = {}
    for item in priceApiResponse[ITEMS]:
        if item[ARM_REGION_NAME] not in newPriceMapping:
            newPriceMapping[item[ARM_REGION_NAME]] = {}
        newPriceMapping[item[ARM_REGION_NAME]
                        ][item[SKU_NAME]] = item[RETAIL_PRICE]
    return newPriceMapping

# Merges current price mapping (price mapping learnt so far) with newest price mapping from current page of Price API response


def mergePriceMappings(currentMapping, newMapping):
    for key in newMapping.keys():
        if key in currentMapping:
            currentMapping[key].update(newMapping[key])
        else:
            currentMapping[key] = newMapping[key]
    return currentMapping


''' Main Program Loop - query Price API until all pages consumed '''
priceMapping = {}
endpoint = PRICE_API_DEDICATED_GATEWAY_ENDPOINT

while True:
    # Queries endpoint
    response = json.loads(requests.get(endpoint).text)
    # pprint(json.loads(response.text))

    # Parses new response and merges with mapping so far
    priceMapping = mergePriceMappings(
        priceMapping, parsePriceApiResponse(response))

    # Checks to see if all pages consumed, if so stops querying, else determines next endpoint
    if response[NEXT_PAGE_LINK]:
        print("Querying next page")
        endpoint = response[NEXT_PAGE_LINK]
    else:
        break

''' Serialize Mapping and save as JSON '''
with open(PRICE_MAPPING_JSON_FILE, "w") as f:
    json.dump(priceMapping, f)

print(
    f"Price Mappings for SQLx Dedicated Gateway written to {PRICE_MAPPING_JSON_FILE}")
