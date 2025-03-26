// Importing modules
// Scraping related modules
import axios from 'axios';
import * as cheerio from 'cheerio';
// Dotenv for environment variables
import 'dotenv/config';
// CSV and file system parser
import {fs} from 'fs';
import {parse} from 'csv-parse/sync';


// TEST SUBJECTS
// const mostExpensive = 'https://everymac.com/systems/apple/macbook_pro/specs/macbook-pro-core-i7-2.9-13-mid-2012-unibody-usb3-specs.html';
const leastExpensive = 'https://everymac.com/systems/apple/macbook/specs/macbook-core-2-duo-2.0-aluminum-13-late-2008-unibody-specs.html'


// scraping data from HTTP
async function getPrice(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const result = $('table#specs37-title tbody tr td:last-child').text();
        // console.log(result);
        return result;
    } catch (error) {
        console.error(error);
    }
}

// returns an array of clean integers from the scraped data 
function priceSplitter(scraped) {
    const prices = scraped.replace(', ','-').split('-');
    for (let i = 0; i < prices.length; i++) {
        prices[i] = Number(prices[i].replace('US$','').replace('*',''));
    }
    return prices;
}

// select max value
function selectMax(split){
    let max = 0;
    for (let i = 0; i < split.length; i++) {
        if (split[i] >= max) {
            max = split[i]
        }
    }
    return max;
}

// select min value
function selectMin(split){
    let min = split[0];
    for (let i = 0; i < split.length; i++) {
        if (split[i] < min) {
            max = split[i]
        }
    }
    return min;
}

// average of all items in array.
function promediator(allData) {
    let sum = 0;
    for (let index = 0; index < allData.length; index++) {
        sum = sum + allData[index];
    }
    return (sum/allData.length)
}

// MAIN FUNCT
async function main() {
    console.log(priceSplitter(await getPrice(leastExpensive)))
    console.log('promedio: ',promediator(priceSplitter(await getPrice(leastExpensive))));
}

main();