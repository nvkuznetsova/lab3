//read data feom stream
const stream = require('stream');
const { parse } = require('@multisolution/multipart-parser');
const trans = stream.Transform({
  transform: function transformer(chunk, encoding, callback) {
      const { file: { value } } = parse(chunk.toString());
      callback(false, Buffer.from(value));
  },
});

module.exports = trans;
