const express = require('express');
const app = express();
const port = 3000;
const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment');

let prayer_times = {};

fs.createReadStream('public/data/prayer_times_hululangat.csv')
	.pipe(csv())
	.on('data', (row) => {
		const date = moment(row['date'], 'DD-MMMM-YYYY');
		prayer_times[date.format('YYYY-MM-DD')] = {
			'date': date,
			'subuh': moment(row['subuh'], 'h:mm a'),
			'zohor': moment(row['zohor'], 'h:mm a'),
			'asar': moment(row['asar'], 'h:mm a'),
			'maghrib': moment(row['maghrib'], 'h:mm a'),
			'isyak': moment(row['isyak'], 'h:mm a'),
		};
	})
	.on('end', () => {
		app.use(express.static('public'));

		app.get('/prayer_times', (req, res) => {
			const date = req.query.date;
			if (date in prayer_times) {
				const times = prayer_times[date];
				res.json({
					'subuh': times['subuh'].format('HH:mm'),
					'zohor': times['zohor'].format('HH:mm'),
					'asar': times['asar'].format('HH:mm'),
					'maghrib': times['maghrib'].format('HH:mm'),
					'isyak': times['isyak'].format('HH:mm'),
				});
			}
		});

		app.listen(port, () => console.log(`listening on port ${port}`));
	});

