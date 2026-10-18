// setting variables

// Dollar conversion rate from wise.com
const dollar_rate = 0.09; 

const miles_rate = 0.621361;

const fahrenheit_rate = (9/5);


// functions
function cedisToDollars(cedis){
    return cedis * dollar_rate;
}

function kmToMiles(km){
    return km * miles_rate;
}

function celsiusToFahrenheit(celsius){
    return celsius * fahrenheit_rate + 32;
}

const cedi_amount = 2789;
const km_value = 94;
const celsius_value = 90;


console.log(`GHC${cedi_amount.toLocaleString("en-GH")} = $${cedisToDollars(cedi_amount).toFixed(2)}`);
console.log(`${km_value}km = ${kmToMiles(km_value).toFixed(2)} miles`);
console.log(`${celsius_value}\u00B0C = ${celsiusToFahrenheit(celsius_value).toFixed(2)}\u00B0F`);