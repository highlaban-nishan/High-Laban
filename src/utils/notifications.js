// Funny, encouraging PWA local notification alerts utility
export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return false;
    }
    
    if (Notification.permission === "granted") {
        return true;
    }
    
    const permission = await Notification.requestPermission();
    return permission === "granted";
};

export const triggerLocalNotification = (title, body, icon = '/logo.png') => {
    if (Notification.permission !== "granted") return;
    
    try {
        const options = {
            body: body,
            icon: icon,
            badge: '/logo.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        };
        new Notification(title, options);
    } catch (err) {
        console.error("Failed to trigger local notification:", err);
    }
};

// Encouraging and humorous alert copy templates
export const RANDOM_MORNING_ALERTS = [
    { title: "🌅 Rise & Shine, Kunafa King!", body: "Time to get that bread (and Nutella)! Let's make today sweet! 🚀" },
    { title: "🌅 Wakey wakey, sleepy head!", body: "Time to wake up and make some viral Pistachio Basbousa! 💚" },
    { title: "🌅 Laban Level 100 awaits!", body: "Good morning! Let's crush today's checklist like we crush premium pistachios! 🏆" }
];

export const RANDOM_NIGHT_ALERTS = [
    { title: "🌙 Shift Completed!", body: "Hey! Work is done, accounts verified. See you tomorrow! Sleep well! 💤" },
    { title: "🌙 Goodnight from High Laban!", body: "Make sure the fridge is locked, or the cheese will escape! Sweet dreams! 🧀" },
    { title: "🌙 Sweet dreams of sweet syrup!", body: "Go rest, you worked hard today! See you tomorrow for more dessert magic! 🍰" }
];

export const FUNNY_ALERTS = {
    checklistWarning: {
        title: "⚠️ The Checklist is Feeling Lonely...",
        body: "Wait! Did you forget the daily outlet checks? Go complete it before the boss notices! 🤫"
    },
    hygieneCheck: {
        title: "💅 Friday Nail & Hygiene Check!",
        body: "Clip those nails, wash those hands! Let's keep the Egyptian dessert pull hygienic and perfect! 🧼"
    },
    warningAlert: {
        title: "🚨 Alert: Mission Critical Checklist!",
        body: "No checklist done in the last 4 hours? We have a code red! Let's get it done ASAP! 🏃‍♂️💨"
    }
};

// Scheduler simulator for PWA local notifications
export const initPWANotifications = () => {
    if (typeof window === 'undefined') return;

    const runScheduler = () => {
        // Trigger a random fun morning alert 8 seconds after launch to demonstrate capability
        setTimeout(() => {
            const morningAlert = RANDOM_MORNING_ALERTS[Math.floor(Math.random() * RANDOM_MORNING_ALERTS.length)];
            triggerLocalNotification(morningAlert.title, morningAlert.body);
        }, 8000);

        // Schedule check-in reminders
        setInterval(() => {
            const hr = new Date().getHours();
            
            // Randomly trigger morning or night alerts on specific hours
            if (hr === 9) {
                const morningAlert = RANDOM_MORNING_ALERTS[Math.floor(Math.random() * RANDOM_MORNING_ALERTS.length)];
                triggerLocalNotification(morningAlert.title, morningAlert.body);
            } else if (hr === 22) {
                const nightAlert = RANDOM_NIGHT_ALERTS[Math.floor(Math.random() * RANDOM_NIGHT_ALERTS.length)];
                triggerLocalNotification(nightAlert.title, nightAlert.body);
            }

            // Check if they did the daily checklist. If not, trigger a warning!
            const dailyChecklistDone = localStorage.getItem('daily_checklist_completed_today');
            if (!dailyChecklistDone && hr >= 12 && hr <= 16) {
                triggerLocalNotification(FUNNY_ALERTS.checklistWarning.title, FUNNY_ALERTS.checklistWarning.body);
            }
        }, 1000 * 60 * 60 * 2); // Check every 2 hours
    };

    // If permission is already granted, run scheduler
    if (Notification.permission === 'granted') {
        runScheduler();
    }
};
