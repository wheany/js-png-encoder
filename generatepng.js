/*jslint bitwise:true, plusplus: true */
/*global Base64: false*/
(function (globalObj) {
	'use strict';

	// 0x78, 7 = 2^(7+8) = 32768 window size (CMF)
	//       8 = deflate compression
	// 0x01, (00 0 00001) (FLG)
	// bits 0 to 4  FCHECK  (check bits for CMF and FLG)
	// bit  5       FDICT   (preset dictionary)
	// bits 6 to 7  FLEVEL  (compression level)

	var DEFLATE_METHOD = String.fromCharCode(0x78, 0x01),
		CRC_TABLE = [],
		SIGNATURE = String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10),
		NO_FILTER = String.fromCharCode(0),

		make_crc_table = function () {
			var n, c, k;

			for (n = 0; n < 256; n++) {
				c = n;
				for (k = 0; k < 8; k++) {
					if (c & 1) {
						c = 0xedb88320 ^ (c >>> 1);
					} else {
						c = c >>> 1;
					}
				}
				CRC_TABLE[n] = c;
			}
		},

		inflateStore = function (data) {
			var MAX_STORE_LENGTH = 65535,
				storeBuffer = '',
				i,
				remaining,
				blockType;

			for (i = 0; i < data.length; i += MAX_STORE_LENGTH) {
				remaining = data.length - i;
				blockType = '';

				if (remaining <= MAX_STORE_LENGTH) {
					blockType = String.fromCharCode(0x01);
				} else {
					remaining = MAX_STORE_LENGTH;
					blockType = String.fromCharCode(0x00);
				}
				// little-endian
				storeBuffer += blockType + String.fromCharCode((remaining & 0xFF), (remaining & 0xFF00) >>> 8);
				storeBuffer += String.fromCharCode(((~remaining) & 0xFF), ((~remaining) & 0xFF00) >>> 8);

				storeBuffer += data.substring(i, i + remaining);
			}

			return storeBuffer;
		},

		adler32 = function (data) {
			var MOD_ADLER = 65521,
				a = 1,
				b = 0,
				i;

			for (i = 0; i < data.length; i++) {
				a = (a + data.charCodeAt(i)) % MOD_ADLER;
				b = (b + a) % MOD_ADLER;
			}

			return (b << 16) | a;
		},

		update_crc = function (crc, buf) {
			var c = crc, n, b;

			for (n = 0; n < buf.length; n++) {
				b = buf.charCodeAt(n);
				c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
			}
			return c;
		},

		crc = function crc(buf) {
			return update_crc(0xffffffff, buf) ^ 0xffffffff;
		},

		dwordAsString = function (dword) {
			return String.fromCharCode((dword & 0xFF000000) >>> 24, (dword & 0x00FF0000) >>> 16, (dword & 0x0000FF00) >>> 8, (dword & 0x000000FF));
		},

		createChunk = function (length, type, data) {
			var CRC = crc(type + data);

			return dwordAsString(length) +
				type +
				data +
				dwordAsString(CRC);
		},

		IEND,

		createIHDR = function (width, height) {
			var IHDRdata;

			IHDRdata = dwordAsString(width);
			IHDRdata += dwordAsString(height);

			// bit depth
			IHDRdata += String.fromCharCode(8);
			// color type: 6=truecolor with alpha
			IHDRdata += String.fromCharCode(6);
			// compression method: 0=deflate, only allowed value
			IHDRdata += String.fromCharCode(0);
			// filtering: 0=adaptive, only allowed value
			IHDRdata += String.fromCharCode(0);
			// interlacing: 0=none
			IHDRdata += String.fromCharCode(0);

			return createChunk(13, 'IHDR', IHDRdata);
		},

		png = function (width, height, rgba) {
			var IHDR = createIHDR(width, height),
				IDAT,
				scanlines = '',
				scanline,
				y,
				x,
				compressedScanlines;

			for (y = 0; y < rgba.length; y += width * 4) {
				scanline = NO_FILTER;
				if (Array.isArray(rgba)) {
					for (x = 0; x < width * 4; x++) {
						scanline += String.fromCharCode(rgba[y + x] & 0xff);
					}
				} else {
					// rgba=string
					scanline += rgba.substr(y, width * 4);
				}
				scanlines += scanline;
			}

			compressedScanlines = DEFLATE_METHOD + inflateStore(scanlines) + dwordAsString(adler32(scanlines));

			IDAT = createChunk(compressedScanlines.length, 'IDAT', compressedScanlines);

			return SIGNATURE + IHDR + IDAT + IEND;
		};

	make_crc_table();
	IEND = createChunk(0, 'IEND', '');

	globalObj.generatePng = png;
}(this));
