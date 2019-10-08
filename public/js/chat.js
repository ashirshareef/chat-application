const socket = io();

//Elements
const $messageForm = document.getElementById('message-form');
const $messageInput = $messageForm.querySelector('input');
const $messageButton = $messageForm.querySelector('button');
const $sendLocationButton = document.getElementById('sendLocation');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
//options
const {username,room}= Qs.parse(location.search,{ignoreQueryPrefix:true});


const autoScroll=()=>{
    console.log('entered auto scroll' );
    //New Message element
    const $newMessage = $messages.lastElementChild;
    console.log('newMessage ',$newMessage );
    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin=parseInt(newMessageStyles.marginBottom) ;
    const newMessageHeight= $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight= $messages.offsetHeight;

    //height of the messages container
    const containerHeight= $messages.scrollHeight;

    //How far have I scrolled ?

    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight-newMessageHeight<=scrollOffset){
        console.log("entered the final condition")
        $messages.scrollTop=$messages.scrollHeight;
    }

}

socket.on('message', (data) => {
    console.log(data);
    const html = Mustache.render(messageTemplate, {
        message: data.text,
        createdAt:moment(data.createdAt).format('h:mm a'),
        username:data.username
    });
    $messages.insertAdjacentHTML('beforeEnd', html);
    autoScroll();
});

$messageForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    $messageButton.setAttribute('disabled', 'disabled');
    const message = $messageInput.value;
    socket.emit('sendMessage', message, (error) => {
        $messageButton.removeAttribute('disabled');
        $messageForm.reset();
        $messageInput.focus();

        if (error) {
            return console.log('error', error);
        }
        console.log("Message was delivered.");
    });
});

$sendLocationButton.addEventListener('click', (ev) => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }
    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log('position',position );
        const locationObject = {longitude: position.coords.latitude, latitude: position.coords.longitude};

        socket.emit('sendLocation', locationObject, (message) => {
            $sendLocationButton.removeAttribute('disabled');
            console.log(message);
        });
    });
});

socket.on('locationMessage', ({url,createdAt,username}) => {
    console.log(url);
    const html = Mustache.render(locationTemplate, {
        url,
        createdAt:moment(createdAt).format('h:mm a'),
        username
    });
    $messages.insertAdjacentHTML('beforeEnd', html);

    autoScroll();

});

socket.emit('join',{username,room},(error) =>{
    if(error){
        alert(error);
        location.href='/';
    }
});

socket.on('roomData',({room,users}) =>{
    // console.log('room',room );
    // console.log('users',users );
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    });
    $sidebar.innerHTML=html;
});
