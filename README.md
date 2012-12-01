js-png-encoder
==============

Javascript PNG encoder

How to use:


Generate raw bitmap data, as a String.
* 1 character = 1 byte.
* Every character with charcode < 256.
* 1 pixel = 32 bits (in this case 4 characters)
* raw data format: RGBA.

Then encode that data into a PNG file using generatePng(width, height, data). generatePng produces an uncompressed png file, (using deflate's store algorithm).

base64-encode the resulting data (use btoa() or some javascript-based base64 encoder, if you need to support a browser that does not support btoa)

Shove that into an &lt;img&gt; tag using a data: url.

**PS: Don't actually do it, it's a silly idea**