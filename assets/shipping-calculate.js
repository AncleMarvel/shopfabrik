const mockupConfig = {
    deliveryDateDisplayClass: 'premium-shipping__delivery-date',
    messageDisplayClass: 'premium-shipping__message',
    timeDisplayClass: 'premium-shipping__time-display'
}

const shippingData = getShippingData();

function getShippingData() {
    const shippingJSON = document.querySelector('.premium-shipping-data').textContent;
    return JSON.parse(shippingJSON);
}

function getShopTimeOffset(shopTimeZone) {
    // shopTimeZone format e.g. +0200
    const timezineFormat = /\+|\-[0-9]{4}/;

    if (typeof shopTimeZone !== 'string') {
        console.error('getShopTimeOffset() shopTimeZone error, shopTimeZone is not String: ', shopTimeZone);
        return;
    }

    if (shopTimeZone.match(timezineFormat) === null) {
        console.error('getShopTimeOffset() shopTimeZone error, shopTimeZone is not String: ', shopTimeZone);
        return;
    }

    const factor = parseInt(`${shopTimeZone[0]}1`);
    const hours = parseInt(`${shopTimeZone[1]}${shopTimeZone[2]}`);
    const minutes = parseInt(`${shopTimeZone[3]}${shopTimeZone[4]}`);
    return factor * hours * 60 + minutes;
}

function convertTime(time, format) {
    if (typeof time !== 'string') {
        console.error('convertTime() time error, time is not String: ', time);
        return;
    }

    if (format === 12) {
        // For the feature: conver 24 to 12, but it's not needed here
    } else if (format === 24) {
        const h = parseInt(time.split(':')[0]);
        const m = parseInt(time.split(':')[1].replace(/[A-Za-z]/gi, ''));
        const meridiemState = time.replace(/[^A-Za-z]/gi, '').toLowerCase();

        if (h > 12) {
            console.error('convertTime() time format error, hours are in the 24 format:', time);
            return;
        }

        if (meridiemState === 'pm') {
            if (h > 12) {
                return;
            }

            let convertedH = h + 12;

            if (convertedH === 24) {
                convertedH = 0;
            }

            return {
                h: convertedH,
                m: m
            }
        } else {
            return {
                h: h,
                m: m
            }
        }

    } else {
        console.error('convertTime() format value error, format value: ', format);
        return;
    }
}

function getShippingRange(beginTimeTwelveHrs, endTimeTwelveHrs, clientDate, offsetDifference) {
    if (typeof beginTimeTwelveHrs !== 'string' || typeof endTimeTwelveHrs !== 'string') {
        console.error(`getShippingRange() error time type, ${typeof beginTimeTwelveHrs} / ${typeof endTimeTwelveHrs}`);
        return;
    }

    if (!(clientDate)) {
        console.error(`getShippingRange() clientDate error, ${clientDate}`);
        return;
    }

    if (typeof offsetDifference === 'undefined') {
        console.error(`getShippingRange() offsetDifference error, ${offsetDifference}`);
        return;
    }

    const beginTime = convertTime(beginTimeTwelveHrs, 24);
    const endTime = convertTime(endTimeTwelveHrs, 24);

    const timeOffset = {
        h: Math.floor(offsetDifference / 60),
        m: offsetDifference % 60
    }

    const beginDate = new Date(clientDate);
    beginDate.setHours(beginTime.h + timeOffset.h);
    beginDate.setMinutes(beginTime.m + timeOffset.m);
    beginDate.setSeconds(0);

    const endDate = new Date(clientDate);
    endDate.setHours(endTime.h + timeOffset.h);
    endDate.setMinutes(endTime.m + timeOffset.m);
    endDate.setSeconds(0);


    if (endDate.getHours() - beginDate.getHours() <= 0) {
        if (timeOffset.h < 0) {
            beginDate.setDate(beginDate.getDate() + 1);
            endDate.setDate(endDate.getDate() + 1);
        }
        if (timeOffset.h > 0) {
            beginDate.setDate(beginDate.getDate() - 1);
            endDate.setDate(endDate.getDate() - 1);
        }
    }

    return {
        begin: beginDate,
        end: endDate
    }
}

function displayDeliveryDate(deliveryDate) {
    const options = {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    };

    const dateString = deliveryDate.toLocaleDateString('de-DE', options);
    const elem = document.querySelector(`.${mockupConfig.deliveryDateDisplayClass}`);

    if (elem) {
        elem.innerText = dateString;
    } else {
        console.error('displayDeliveryDate() element error');
    }
}

function displayMessageAndTime(time, day = '', message) {
    if (typeof message !== 'string' || message.length < 1) {
        console.error('displayMessageAndTime() message error, message: ', message);
        return;
    }

    if (typeof time !== 'string') {
        console.error('displayMessageAndTime() time !== string, time: ', time);
        return;
    }

    const messageElement = document.querySelector(`.${mockupConfig.messageDisplayClass}`);
    const dateDisplay = document.querySelector(`.${mockupConfig.timeDisplayClass}`);

    if (dateDisplay && messageElement) {
        messageElement.innerText = message;
        dateDisplay.innerText = `${time} ${day}`;
    } else {
        console.error('displayMessageAndTime() elements error');
    }
}

function displayRemainingTime() { }

function addZero(num) {
    if (typeof num !== 'number') {
        console.error('addZero() num !== number');
        return;
    }

    if (num === undefined) {
        console.error('addZero() num is undefined');
        return;
    }

    if (num >= 0 && num <= 9) {
        return `0${num}`;
    } 

    return num;
}

function timePositionsHandlersInit(shippingRange, localDate) {
    if (!(shippingRange)) {
        console.error(`timePositionsHandlersInit() shippingRange error, ${shippingRange}`);
        return;
    }

    if (!(localDate)) {
        console.error(`timePositionsHandlersInit() localDate error, ${localDate}`);
        return;
    }

    const startOfTheDay = new Date(localDate);
    startOfTheDay.setHours(0);
    startOfTheDay.setMinutes(0);
    startOfTheDay.setSeconds(0);
    startOfTheDay.setMilliseconds(0);

    const endOfTheDay = new Date(localDate);
    endOfTheDay.setHours(59);
    endOfTheDay.setMinutes(59);
    endOfTheDay.setSeconds(59);
    endOfTheDay.setMilliseconds(59);

    const deliveryDays = +shippingData['product_delivery_days'] || +shippingData['default_delivery_days'];
    
    const deliveryDate = new Date(localDate);
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    if (localDate >= startOfTheDay && localDate < shippingRange.begin) {
        displayDeliveryDate(deliveryDate);
        displayMessageAndTime(
            shippingData['shipping_end'],
            'today',
            shippingData['message_before_open']
        );
    } else if (localDate >= shippingRange.begin && localDate < shippingRange.end) {
        const h = addZero(shippingRange.end.getHours() - localDate.getHours());
        const m = addZero(shippingRange.end.getMinutes() - localDate.getMinutes());

        displayDeliveryDate(deliveryDate);
        displayMessageAndTime(
            `${h}h:${m}m`,
            '',
            shippingData['message_untill_close']
        );
    } else if (localDate >= shippingRange.end && localDate <= endOfTheDay) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        
        displayDeliveryDate(deliveryDate);
        displayMessageAndTime(
            shippingData['shipping_end'],
            'tomorrow',
            shippingData['message_before_open']
        );
    } else {
        console.error(`timePositionsHandlersInit() localdate is out of position: ${localDate}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Test cases:
    // Mon Jul 05 2022 00:30:00 GMT+0300
    // Mon Jul 05 2022 23:40:00 GMT+0300
    // Mon Jul 05 2022 14:00:00 GMT+0300
    const clientLocalDate = new Date('Mon Jul 05 2022 07:00:00 GMT+0300');

    const factor = -1;
    const clientTimeOffset = clientLocalDate.getTimezoneOffset() * factor;
    const shopTimeZoneWithoutDevider = shippingData['shop_time_zone'];
    const shopTimeOffset = getShopTimeOffset(shopTimeZoneWithoutDevider);

    const offsetDifference = clientTimeOffset - shopTimeOffset;

    const shippingRange = getShippingRange(
        shippingData['shipping_begin'],
        shippingData['shipping_end'],
        // test cases: 10:50AM shopTZ +0200, 00:30AM shopTZ +0200, 12:00AM
        // test cases: 11:50PM shopTZ +0200, 06:50AM shopTZ +0200, 05:00PM
        clientLocalDate,
        offsetDifference
    );

    timePositionsHandlersInit(shippingRange, clientLocalDate);
});