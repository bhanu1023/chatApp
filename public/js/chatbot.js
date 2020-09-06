const socket = io()

const $Form = document.querySelector('#chatform')
const $FormInput = document.querySelector('input')
const $Formbutton = document.querySelector('#sendmsg')
const $Locbutton = document.querySelector('#sendlocation')
const $message = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')


const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const usersTemplate = document.querySelector('#sidebar-template').innerHTML

const {username,room} = Qs.parse(document.location.search,{ignoreQueryPrefix: true})

const autoscroll = () => {
    const $newMessage = $message.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessagesMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessagesMargin

    const visibleHeight = $message.offsetHeight

    const containerHeight = $message.scrollHeight

    const scrollOffset = $message.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $message.scrollTop = $message.scrollHeight
    }
}

socket.on('welcomeIntent',(message) =>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(locationURL)=>{
    console.log(locationURL)
    const html = Mustache.render(locationTemplate,{
        locationURL: locationURL.text,
        createdAt: moment(locationURL.createdAt).format('h:mm a'),
        username: locationURL.username
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(usersTemplate,{
        room,
        users
    })
    $sidebar.innerHTML = html
})

$Form.addEventListener('submit',(event,callback)=>{
    event.preventDefault()
    $Formbutton.setAttribute('disabled','disabled')
    const textbox = event.target.elements.message
    const msg = textbox.value
    if(msg){
        socket.emit('sendMessage',msg,()=>{
            $Formbutton.removeAttribute('disabled')
        })
        textbox.value = ''
        $FormInput.focus()
    }
})

$Locbutton.addEventListener('click',(event)=>{
    $Locbutton.setAttribute('disabled','disabled')
    if(!navigator.geolocation){
        return alert('Location sharing Failed!')
    }
    navigator.geolocation.getCurrentPosition((position)=>{
        const postionObj = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation',postionObj,()=>{
            console.log("loc shared!")
            $Locbutton.removeAttribute('disabled')
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href = "/"
    }
})

