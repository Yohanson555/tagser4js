const _ = require('lodash');
const assert = require('assert');
const Tagser = require('../src/tagser');
const { TYPE_TEXT, TYPE_TAG } = require('../src/sup')

describe('Testing correct sources', () => {
  var tagser = new Tagser();

  it('Only text', () => {
    let html = 'Simple text';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].type(), TYPE_TEXT);
    assert.equal(list[0].body(), 'Simple text');
    assert.equal(list[0].childs().length, 0);
    assert.equal(list[0].name(), '');
  });

  it('Only text with spaces', () => {
    let html = '  Simple text   ';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].type(), TYPE_TEXT);
    assert.equal(list[0].body(), 'Simple text');
  });

  it('Only text with escapeing', () => {
    let html = '  Simple text \\<';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].type(), TYPE_TEXT);
    assert.equal(list[0].body(), 'Simple text \<');
  });

  it('Selfclosed tag with no attrs', () => {
    let html = '<tag/>';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].name(), 'tag');
    assert.equal(list[0].type(), TYPE_TAG);
    assert.equal(list[0].body(), null);
    assert.equal(list[0].childs().length, 0);
    assert.equal(_.size(list[0].attributes()), 0);
  });

  it('Selfclosed tag with space after name', () => {
    let html = '<tag />';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].name(), 'tag');
    assert.equal(list[0].type(), TYPE_TAG);
    assert.equal(list[0].body(), null);
    assert.equal(list[0].childs().length, 0);
    assert.equal(_.size(list[0].attributes()), 0);
  });

  it('Selfclosed tag with one bool attribute', () => {
    let html = '<tag attr/>';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].name(), 'tag');
    assert.equal(list[0].type(), TYPE_TAG);

    let attrs = list[0].attributes();

    assert.equal(_.size(attrs), 1);
    assert.equal(attrs.attr.name, 'attr');
    assert.equal(attrs.attr.value, 'true');
  });

  it('Selfclosed tag with two params', () => {
    let html = '<tag A B="value"/>';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].name(), 'tag');
    assert.equal(list[0].type(), TYPE_TAG);

    let attrs = list[0].attributes();

    assert.equal(_.size(attrs), 2);
    assert.equal(attrs.A.name, 'A');
    assert.equal(attrs.A.value, 'true');
    assert.equal(attrs.B.name, 'B');
    assert.equal(attrs.B.value, 'value');
    assert.equal(list[0].attrValue('B'), 'value');
    assert.equal(list[0].attrValue('C'), null);
  });

  it('Selfclosed tag with two params with same name', () => {
    let html = '<tag A A="value"/>';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].name(), 'tag');
    assert.equal(list[0].type(), TYPE_TAG);

    let attrs = list[0].attributes();

    assert.equal(_.size(attrs),1);
    assert.equal(attrs.A.name, 'A');
    assert.equal(attrs.A.value, 'value');
  });

  it('Simple block tag', () => {
    let html = '<tag>tag body</tag>';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].name(), 'tag');
    assert.equal(list[0].type(), TYPE_TAG);

    let childs = list[0].childs();

    assert.equal(childs.length, 1);
    assert.equal(childs[0].name(), '');
    assert.equal(childs[0].type(), TYPE_TEXT);
    assert.equal(childs[0].body(), 'tag body');
  });

  it('Nested block tags', () => {
    let html =
      '<u><row><cell>{{name}}</cell><cell width="3">{{quantity}}</cell><cell width="8" align="right">{{\$item_price}}</cell></row></u>';
    let list = tagser.parse(html);

    assert.equal(list.length, 1);
    assert.equal(list[0].name(), 'u');
    assert.equal(list[0].type(), TYPE_TAG);

    let childs = list[0].childs();

    assert.equal(childs.length, 1);
    assert.equal(childs[0].name(), 'row');
    assert.equal(childs[0].type(), TYPE_TAG);

    let childs2 = childs[0].childs();

    assert.equal(childs2.length, 3);
    assert.equal(_.size(childs2[0].attributes()), 0);
    assert.equal(childs2[0].childs()[0].body(), '{{name}}');
    assert.equal(_.size(childs2[1].attributes()), 1);
    assert.equal(childs2[1].childs()[0].body(), '{{quantity}}');
    assert.equal(_.size(childs2[2].attributes()), 2);
    assert.equal(childs2[2].childs()[0].body(), '{{\$item_price}}');
  });
});

describe('Testing malformed sources', () => {
  let tagser = new Tagser();

  it('Malformed tag', () => {
    let html = '< tag >';
    assert.throws(() => tagser.parse(html), {
      message: `Error (3) on 1:1 Tag malformed`
    });
  });

  it('Empty tag name', () => {
    let html = '< />';

    assert.throws(() => tagser.parse(html), {
      message: `Error (3) on 1:1 Tag malformed`
    });
  });

  it('Closed tag withou opened', () => {
    let html = '</tag>';

    assert.throws(() => tagser.parse(html), {
      message: `Error (5) on 1:1 Source document malformed`
    });
  });

  it('Malformed tag #2', () => {
    let html = '<tag#%^adf >';

    assert.throws(() => tagser.parse(html), {
      message: `Error (1) on 1:4 Wrong tag name character: #`
    });
  });

  it('Malformed tag #3', () => {
    let html = '<tag #%^>';

    assert.throws(() => tagser.parse(html), {
      message: `Error (3) on 1:5 Tag malformed`
    });
  });

  it('Close bracket with space', () => {
    let html = '<tag / >';

    assert.throws(() => tagser.parse(html), {
      message: `Error (4) on 1:6 Wrong character given: " ". ">" awaits`
    });
  });

  it('Wrong close tag1', () => {
    let html = '<tag></tag1>';

    assert.throws(() => tagser.parse(html), {
      message: `Error (6) on 1:11 Wrong close tag: tag1`
    });
  });

  it('Wrong attr #1', () => {
    let html = '<tag A%/>';

    assert.throws(() => tagser.parse(html), {
      message: `Error (3) on 1:6 Tag malformed`
    });
  });

  it('Wrong attr #2', () => {
    let html = '<tag B=/>';

    assert.throws(() => tagser.parse(html), {
      message: `Error (9) on 1:7 Attribute value malfromed: the attribute value should be a string`
    });
  });

  it('Wrong attr #3', () => {
    let html = '<tag B=true/>';

    assert.throws(() => tagser.parse(html), {
      message: `Error (9) on 1:7 Attribute value malfromed: the attribute value should be a string`
    });
  });

  it('Wrong attr #4', () => {
    let html = '<tag B=3456/>';

    assert.throws(() => tagser.parse(html), {
      message: `Error (9) on 1:7 Attribute value malfromed: the attribute value should be a string`
    });
  });

  it('Wrong attr #5', () => {
    let html = '<tag B="" />';

    assert.throws(() => tagser.parse(html), {
      message: `Error (8) on 1:8 Attribute malformed: empty value`
    });
  });

  it('Malformed document', () => {
    let html = '<tag> tag body';

    assert.throws(() => tagser.parse(html), {
      message: `Source document malformed.`
    });
  });
});

