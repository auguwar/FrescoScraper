// leo el csv y a partir de cada valor, genero un objeto con el modelo y el precio
// y lo guardo en un array.
// luego recorro nuevamente ese array de objetos y saco promedio de los precios de los modelos repetidos, que vuelven a ser guardados en un segundo array para luego ser exportados a odoo
// https://everymac.com/systems/by_capability/mac-specs-by-machine-model-machine-id.html listado completo del sitio

// Importing modules
// Scraping related modules
import axios from 'axios';
import * as cheerio from 'cheerio';
// Dotenv for environment variables
import 'dotenv/config';
// CSV and file system parser
import { promises as fs } from 'fs';
import xmlrpc from 'xmlrpc';

const minHour = 29

// loading csv file into an array of objects, each object containing model and url
async function loadCSV(myFile) {
    try {
        const data = await fs.readFile(myFile, 'ascii');
        const lines = data.split('\n');
        const results = lines
            .map(line => {
                const [model, url] = line.split(',');
                if (!model || !url) {
                    return null; // Skip malformed or empty lines
                }
                return { model: model.trim(), url: url.trim() };
            })
            .filter(item => item !== null); // Remove null entries
        return results;
    } catch (err) {
        throw err;
    }
}

// turning the array of objects into a new array of objects with the model and price, and then returning the new array
async function pricesFromCSVArr(arr) {
    const newArr = [];
    for (let i = 0; i < arr.length; i++) {
        const price = await getPrice(arr[i].url);
        const split = priceSplitter(price);
        console.log('split: ',split);
        const average = promediator(split);
        const model = arr[i].model;
        const data = {
            model: model,
            price: average
        }
        console.log('Modelo: ',model)
        newArr.push(data);
    }
    return newArr;
}

// function to get the average price of all models and return an array of objects with the model and average price
function averagePrice(arr) {
    const results = [{ model: '', price: 0 }];
    const orderedModels = arr.sort((a, b) => a.model.localeCompare(b.model));
    // console.log(orderedModels);
    for (let i = 0; i < orderedModels.length; i++) {
        // console.log(orderedModels[i].model);
        if (isNaN(orderedModels[i].price)) {
            console.log('not a number encontrado en: ', orderedModels[i].model);
            continue;
        } else if (orderedModels[i].model !== results[results.length - 1].model) {
            const firstIndex = orderedModels.findIndex((element) => element.model === orderedModels[i].model);
            // console.log('first index: ',firstIndex);
            const lastIndex = orderedModels.findLastIndex((element) => element.model === orderedModels[i].model);
            // console.log('last index: ', lastIndex);
            const values = [];
            for (let j = firstIndex; j <= lastIndex; j++) {
                values.push(orderedModels[j].price);
            }
            //console.log('values: ', values);
            results.push({ model: orderedModels[i].model, avgPrice: promediator(values) });
        }
    }
    return results.slice(1);
}

// Helper function to introduce a delay
function delay(ms) {
    const randomized = Math.floor(Math.random() * 3000)+ms;
    console.log('Delaying request for ', randomized, 'ms');
    return new Promise(resolve => setTimeout(resolve, randomized));
}

// scraping data from HTTP
async function getPrice(url) {
    try {
        await delay(2000); // Delay to avoid being blocked by the server
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const result = $('table#specs37-title tbody tr td:last-child').text();
        console.log(result);
        return result;
    } catch (error) {
        console.error(error);
        return NaN;
    }
}

// returns an array of clean integers from the scraped data 
function priceSplitter(scraped) {
    const prices = scraped.replace(/ /g, '').replace(/,/g, '-').split('-');
    for (let i = 0; i < prices.length; i++) {
        prices[i] = Number(prices[i].replace(/US\$|\*+/g, ''));
    }
    console.log('',prices);
    prices.forEach(element => {
        console.log(element)
    });
    return prices.filter(price => !isNaN(price));
}

// average of all items in array.
function promediator(allData) {
    let sum = 0;
    for (let index = 0; index < allData.length; index++) {
        sum = sum + allData[index];
    }
    return (sum / allData.length)
}

const config = {
    url: 'http://localhost:8069',
    db: '16test',
    username: 'guccibot@frescoservice.com',
    password: 'garolfa',
};

// Cliente para autenticación
const commonClient = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });

// Cliente para llamadas a objetos
const objectClient = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });

// ODOO PRODUCT SEARCH
function odooSearch(model) {
    // Llamada a search_read
    const args = [
        config.db,
        8,
        config.password,
        'product.template',
        'search_read',
        [[['default_code', '=', `MO${model}`]]],
        { fields: ['id'], limit: 0 }
    ];

    return new Promise((resolve, reject) => {
        objectClient.methodCall('execute_kw', args, (err, products) => {
            if (err) {
                console.error('Error al buscar productos:', err);
                return reject(err);
            }
            if (products.length > 0) {
                console.log('Producto encontrado: ', products[0].id);
                resolve(products[0].id);
            } else {
                console.log('No se encontró el producto.');
                resolve(null);
            }
        });
    });
}

// ODOO PRICE UPDATE
function odooUpdatePrice(id, price) {
    //  4. ID de la plantilla y nuevo precio
    // const templateId = 23;       // reemplazá con el ID real
    // const nuevoPrecio = 11111;   // valor que quieras asignar

    // 5. Ejecutar write en product.template
    const args = [
        config.db,
        8,
        config.password,
        'product.template',    // modelo a actualizar
        'write',               // método
        [[id],      // lista de IDs a actualizar
        { list_price: price } // campos a modificar
        ]
    ];

    objectClient.methodCall('execute_kw', args, (err2, result) => {
        if (err2) {
            return console.error('Error al actualizar list_price:', err2);
        }
        console.log(`Resultado de la actualización:`, result);
        // result = true si se actualizó correctamente
    });
};

// ODOO PRICE UPDATE
function odooUpdateCost(id, cost) {
    //  4. ID de la plantilla y nuevo precio
    // const templateId = 23;       // reemplazá con el ID real
    // const nuevoPrecio = 11111;   // valor que quieras asignar

    // 5. Ejecutar write en product.template
    const args = [
        config.db,
        8,
        config.password,
        'product.template',    // modelo a actualizar
        'write',               // método
        [[id],      // lista de IDs a actualizar
        { standard_price: cost } // campos a modificar
        ]
    ];

    objectClient.methodCall('execute_kw', args, (err2, result) => {
        if (err2) {
            return console.error('Error al actualizar list_price:', err2);
        }
        console.log(`Resultado de la actualización:`, result);
        // result = true si se actualizó correctamente
    });
};

// SEARCH N UPDATE
async function searchAndUpdate(arr) {
    const orphans = [];
    console.log(arr);
    console.log(typeof arr);
    for (let i = 0; i < arr.length; i++) {
        const model = arr[i].model;
        console.log('Modelo: ', model);
        const price = arr[i].avgPrice;
        console.log('Precio: ', price);
        var id;
        try {
            id = await odooSearch(model);
        } catch (error) {
            console.error('Error al buscar el producto en Odoo:', error);
            orphans.push(model);
            continue; // Skip to the next iteration
        }
        console.log('ID: ', id);
        odooUpdateCost(id, (minHour+((price)/100)));
    }
    console.log('Missing in Odoo: ', orphans);
}

// MAIN FUNCT
async function main() {
    await loadCSV('macbooks.csv')
        .then(results => pricesFromCSVArr(results))
        .then(results => averagePrice(results))
        .then(results => searchAndUpdate(results))
        .catch(err => console.error(err));
};

await main();