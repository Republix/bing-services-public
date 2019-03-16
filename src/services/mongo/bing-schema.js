const schema = {
    "startdate": String,
    "fullstartdate": String,
    "enddate": String,
    "url": String,
    "urlbase": String,
    "copyright": String,
    "copyrightlink": String,
    "title": String,
    "quiz": String,
    "wp": Boolean,
    "hsh": String,
    "drk": Number,
    "top": Number,
    "bot": Number,
    "hs": Array,
    "date": String,
    "attribute": String,
    "para1": String,
    "para2": String,
    "provider": String,
    "imageUrl": String,
    "primaryImageUrl": String,
    "Country": String,
    "City": String,
    "Longitude": String,
    "Latitude": String,
    "Continent": String,
    "CityInEnglish": String,
    "CountryCode": String,
    "id": String
}
const extend = {
    createdAt: 'createdTs',
    updateAt: 'updateTs'
}

const name = 'bings'

module.exports = {
    schema,
    extend,
    name
}