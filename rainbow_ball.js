/*jslint plusplus: true */
(function (globalObj) {
	'use strict';

	// from wikipedia:
	// h: 0 ... 360, s: 0 ... 1, v: 0 ... 1
	var hsv2rgb = function (h, s, v) {
		var c = v * s, // chroma
			sector = (h % 360) / 60,
			x = c * (1 - Math.abs(sector % 2 - 1)), // second largest component
			r1,
			g1,
			b1,
			m = v - c;

		switch (Math.floor(sector)) {
		case 0:
			r1 = c;
			g1 = x;
			b1 = 0;
			break;
		case 1:
			r1 = x;
			g1 = c;
			b1 = 0;
			break;
		case 2:
			r1 = 0;
			g1 = c;
			b1 = x;
			break;
		case 3:
			r1 = 0;
			g1 = x;
			b1 = c;
			break;
		case 4:
			r1 = x;
			g1 = 0;
			b1 = c;
			break;
		case 5:
			r1 = c;
			g1 = 0;
			b1 = x;
			break;
		default:
			throw 'hue out of range: ' + h;
		}
		return {
			r: Math.round((r1 + m)*255),
			g: Math.round((g1 + m)*255),
			b: Math.round((b1 + m)*255)
		};
	};

	globalObj.createRainbowBall = function (radius, phases) {
		var	RADIUS_SQ = radius * radius, pngData = "",
			pngW = 2 * radius,
			pngH = 2 * radius,
			cenX = pngW / 2,
			cenY = pngH / 2,
			ang, y, x, a, color, diffX2, diffY2, d;

		for (y = 0; y < pngH; y++) {
			for (x = 0; x < pngW; x++) {
				ang = Math.atan2(cenY - y, cenX - x);

				ang = ang * (180 / Math.PI) * phases;
				while (ang < 0) {
					ang += 360;
				}
				while (ang > 360) {
					ang -= 360;
				}

				color = hsv2rgb(ang, 1, 1);

				a = 255;

				diffX2 = (x - cenX) * (x - cenX);
				diffY2 = (y - cenY) * (y - cenY);

				if (diffX2 + diffY2 > RADIUS_SQ) {
					a = 0;
				} else if (diffX2 + diffY2 > (radius - 1) * (radius - 1)) {
					d = Math.sqrt(diffX2 + diffY2);
					a = Math.round(255 * (radius - d));
				}

				pngData += String.fromCharCode(color.r, color.g, color.b, a);
			}
		}

		return pngData;
	};
}(this));