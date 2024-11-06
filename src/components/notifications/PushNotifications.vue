<template>
    <span></span>
</template>
<script setup>
import { onUnmounted } from 'vue';
const oneSignalID = "7daa476f-ee8d-49b6-bf77-e6bcfafca1a5"


var OneSignal = window.OneSignal || [];
OneSignal.push(function() {
    console.log("🚀 ~ ONE_SIGNAL_APP_ID:", oneSignalID);
    OneSignal.init({
        // appId: process.env.ONE_SIGNAL_APP_ID,


        appId: oneSignalID,

    });

});




// OneSignal?.push(() => {
//     OneSignal?.on('notificationClick', function (event) {
//         console.log("🚀 ~ file: PushNotifications.vue:23 EVEEENT ~ OneSignal?.on ~ event:", event)
//     });
//     OneSignal?.on('change', function (event) {
//         console.log("🚀 ~ file: PushNotifications.vue:23 EVEEENT ~ OneSignal?.on ~ event:", event)
//     });
//     OneSignal?.on('notificationDisplay', function (event) {
//         console.log("🚀 ~ file: PushNotifications.vue:23 EVEEENT ~ OneSignal?.on ~ event:", event)
//     });
// })



OneSignal?.on('notificationClick', function (event) {
    console.log("🚀 ~ file: PushNotifications.vue:23 EVEEENT notificationClick ~ OneSignal?.on ~ event:", event)
});
OneSignal?.on('change', function (event) {
    console.log("🚀 ~ file: PushNotifications.vue:23 EVEEENT change ~ OneSignal?.on ~ event:", event)
});
OneSignal?.on('notificationDisplay', function (event) {
    console.log("🚀 ~ file: PushNotifications.vue:23 EVEEENT  notificationDisplay~ OneSignal?.on ~ event:", event)
});
window.onmessage = function (event) {
    console.log("🚀 ~ file: PushNotifications.vue:23 EVEEENT message ~ OneSignal?.on ~ event:", event)
};

window.OneSignal?.on('message', function (event) {
    // Access the notification data
    const notificationData = event.notification.data;

    // Log the notification data to the console
    console.log('Incoming Notification:', notificationData);

    // You can also access other properties of the notification if needed
    const notificationTitle = event.notification.title;
    const notificationBody = event.notification.body;

    // Log other notification properties if needed
    console.log('Notification Title:', notificationTitle);
    console.log('Notification Body:', notificationBody);
});

onUnmounted(() => {
    // window.OneSignal.removeEventListener('subscriptionChange');
    // window.OneSignal.PushSubscription.optOut();
});
</script>