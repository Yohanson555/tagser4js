## Overview

Simple tag-based document parser. It is not about HTML parsing. You can use whatever tags you want.

Available types of tags:
- Self closing tags: <tag [attributes]/>
- Block tags: <tag [attributes]> Body </tag>

Attributes types: 
- bool: <tag bordered /> - will be converted to `bordered='true'`
- with value: <tag bordered='false' width='7' /> - value should be placed in single or double quotes

## Usage

A simple usage example:

```javascript

  const Tagser = require('tagser4js');
  var tagser = new Tagser();
  var html = '<hello> Hello bro </hello>';
  
  var list =  tagser.parse(html);
  
}
```

## Notes

- Tag names are case sensitive. Open and close tags in block tag declaration should have the same spelling
- Attribute names are case sensitive: attribute `A` and attribute `a` are not the same

## Restrictions
- All self closing tags should have slash before closing bracket. Using `<br>` tag without slash will cause an error.
- No spaces allowed between open bracket and tag name: `< tag />` - will cause an error
- No spaces allowed between slash and close bracket : `<tag / >` - will cause an error
- No spaces allowed in attribute declaration:
 - `<tag A = 'value'` /> - error
 - `<tag A= 'value'` /> - error
 - `<tag A ='value'` /> - error

## Options

You can pass options to the `Tagser` constructor or set them with `setOption()` method.

Available options:
- `ignoreCase` - enables or disables case ignoring of opening and closing tag; `false` by default