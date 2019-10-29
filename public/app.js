let currentDate = '';
let currentPrayerTimes = null;
let currentPrayer = null;
let adjustment = moment.duration(0); // for debugging
const surah = new Audio('/audio/surah_almulk.ogg');

function playAzan() {
	const alarm = new Audio('/audio/azan.ogg');
	alarm.play();

	setTimeout(() => {
		alarm.pause();
	}, 13000);
}

function playAlarm(duration, cb) {
	const alarm = new Audio('/audio/alarm.ogg');
	alarm.play();

	setTimeout(() => {
		alarm.pause();
		if (cb) {
			cb();
		}
	}, duration);
}

// tick is called every second.
function tick() {
	// Update prayer times whenever date changes
	let newDate = moment().add(adjustment).format('YYYY-MM-DD');
	if (newDate != currentDate) {
		currentDate = newDate;
		updatePrayerTimes();
	}

	showTime();
	notifyNextPrayerTime();

	setTimeout(tick, 1000);
}

function showTime() {
	var date = moment().add(adjustment); 
	var h = date.hours();
	var m = date.minutes();
	var s = date.seconds();

	h = (h < 10) ? "0" + h : h;
	m = (m < 10) ? "0" + m : m;
	s = (s < 10) ? "0" + s : s;

	var time = h + ":" + m + ":" + s;

	document.getElementById("clock").innerHTML = time;
}

function getNextPrayer() {
	const prayers = ['subuh', 'zohor', 'asar', 'maghrib', 'isyak'];
	const now = moment().add(adjustment);

	for (const prayer of prayers) {
		if (now.isBefore(currentPrayerTimes[prayer])) {
			return [prayer, currentPrayerTimes[prayer]];
		}
	}

	return [
		'subuh',
		currentPrayerTimes['subuh'].clone().add(1, 'days'),
	];
}

function notifyNextPrayerTime() {
	if (currentPrayerTimes == null) {
		return;
	}

	const now = moment().add(adjustment);
	const next = getNextPrayer();

	if (!currentPrayer) {
		if (now.isAfter(next[1].clone().subtract(5, 'minutes'))) {
			surah.currentTime = 0;
			surah.play();

			setBlinking(next[0], true);
			currentPrayer = next[0];
		}
	} else {
		if (now.isSame(currentPrayerTimes[currentPrayer].clone(), 'second')) {
			// TODO: it's possible this might not get triggered, or triggered more than once
			surah.pause();
			playAlarm(5000, () => playAzan());
		} else if (now.isAfter(currentPrayerTimes[currentPrayer].clone().add(1, 'minutes'))) {
			surah.pause();
			setBlinking(currentPrayer, false);
			currentPrayer = null;
		}
	}
}

function setBlinking(prayer, blink) {
	if (blink) {
		$('#'+prayer).parent().addClass('blink');
	} else {
		$('#'+prayer).parent().removeClass('blink');
	}
}

function updatePrayerTimes() {
	const date = moment().add(adjustment);
	const url = '/prayer_times?date=' + date.format('YYYY-MM-DD');

	const prayers = ['subuh', 'zohor', 'asar', 'maghrib', 'isyak'];

	fetch(url).then(response => response.json())
	.then(data => {
		document.getElementById('subuh').innerHTML = data['subuh'];
		document.getElementById('zohor').innerHTML = data['zohor'];
		document.getElementById('asar').innerHTML = data['asar'];
		document.getElementById('maghrib').innerHTML = data['maghrib'];
		document.getElementById('isyak').innerHTML = data['isyak'];

		currentPrayerTimes = {
			'date': date.format('YYYY-MM-DD'),
			'subuh': moment(data['subuh'], 'HH:mm'),
			'zohor': moment(data['zohor'], 'HH:mm'),
			'asar': moment(data['asar'], 'HH:mm'),
			'maghrib': moment(data['maghrib'], 'HH:mm'),
			'isyak': moment(data['isyak'], 'HH:mm'),
		};

		// Make sure date is updated
		for (const prayer of prayers) {
			currentPrayerTimes[prayer].year(date.year());
			currentPrayerTimes[prayer].month(date.month());
			currentPrayerTimes[prayer].date(date.date());
		}
	});
}

// Start ticking
tick();
