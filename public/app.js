let currentDate = '';
let currentPrayerTimes = null;
let currentPrayer = null;

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
	showTime();
	notifyNextPrayerTime();

	// Update prayer times whenever date changes
	let newDate = moment().format('YYYY-MM-DD');
	if (newDate != currentDate) {
		currentDate = newDate;
		updatePrayerTimes();
	}

	setTimeout(tick, 1000);
}

function showTime() {
	var date = new Date();
	var h = date.getHours(); // 0 - 23
	var m = date.getMinutes(); // 0 - 59
	var s = date.getSeconds(); // 0 - 59
	var session = "AM";

	if (h == 0) {
		h = 12;
	}
	if (h > 12) {
		h = h - 12;
		session = "PM";
	}

	h = (h < 10) ? "0" + h : h;
	m = (m < 10) ? "0" + m : m;
	s = (s < 10) ? "0" + s : s;

	var time = h + ":" + m + ":" + s;
	document.getElementById("clock").innerText = time;
	document.getElementById("clock").textContent = time;
}

function getNextPrayer() {
	const prayers = ['subuh', 'zohor', 'asar', 'maghrib', 'isyak'];
	const now = moment();

	for (const prayer of prayers) {
		if (now.isBefore(currentPrayerTimes[prayer])) {
			return prayer;
		}
	}
}

function notifyNextPrayerTime() {
	if (currentPrayerTimes == null) {
		return;
	}

	const now = moment();
	const next = getNextPrayer();
	if (!currentPrayer) {
		if (now.isAfter(currentPrayerTimes[next].clone().subtract(5, 'minutes'))) {
			const surah = new Audio('/audio/surah_almulk.ogg');
			surah.play();

			setBlinking(next, true);
			currentPrayer = next;
		}
	} else {
		if (now.isSame(currentPrayerTimes[currentPrayer].clone(), 'second')) {
			// TODO: it's possible this might not get triggered, or triggered more than once
			playAlarm(5000, () => playAzan());
		} else if (now.isAfter(currentPrayerTimes[currentPrayer].clone().add(1, 'minutes'))) {
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
	const date = moment();
	const url = '/prayer_times?date=' + date.format('YYYY-MM-DD');

	fetch(url).then(response => response.json())
	.then(data => {
		document.getElementById('subuh').innerHTML = data['subuh'];
		document.getElementById('zohor').innerHTML = data['zohor'];
		document.getElementById('asar').innerHTML = data['asar'];
		document.getElementById('maghrib').innerHTML = data['maghrib'];
		document.getElementById('isyak').innerHTML = data['isyak'];

		currentPrayerTimes = {
			'subuh': moment(data['subuh'], 'HH:mm'),
			'zohor': moment(data['zohor'], 'HH:mm'),
			'asar': moment(data['asar'], 'HH:mm'),
			'maghrib': moment(data['maghrib'], 'HH:mm'),
			'isyak': moment(data['isyak'], 'HH:mm'),
		};
	});
}

// Start ticking
tick();
