const Tagser = require('tagser');

let tagser = new Tagser();
let html = '<tag A B="value"/>';
let list = tagser.parse(html);

console.log(list);