export const showNotification = (senderName:string, messageContent:string, groupId:string) => {
  // Check if the browser supports notifications
  if (!('Notification' in window)) {
    console.warn('Browser does not support desktop notification.');
    return;
  }

  // Check if permission has been granted
  if (Notification.permission === 'granted') {
    const notification = new Notification(`New message from ${senderName}`, {
      body: messageContent,
      icon: '/icons/notification-icon.png', // Optional: Replace with your group/sender image
      tag: groupId // Optional: Used to prevent multiple notifications for the same chat/event
    });

    // Optional: Add an action when the user clicks the notification
    notification.onclick = () => {
      window.focus(); // Bring the app window to the foreground
      // You might also navigate to the specific chat:
      // window.location.href = `/groups/${groupId}`; 
    };
  } else if (Notification.permission !== 'denied') {
    // If permission hasn't been granted or denied, ask for it
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        // Re-call the function now that permission is granted
        showNotification(senderName, messageContent, groupId);
      }
    });
  }
};