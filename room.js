const APIController = (function(){
    const CLIENT_ID = config.CLIENT_ID
    const CLIENT_SECRET = config.CLIENT_SECRET

    const _getAccessToken = async () => {
        const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization':'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await res.json()

        return data.access_token
    }

    const _getTrackInfo = async (token, trackName) => {
        const limit = 10
        if (trackName == '') return
        
        const res = await fetch(`https://api.spotify.com/v1/search?q=${trackName}&type=track&limit=${limit}`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + token}
        });

        const data = await res.json();
        const itemsList = data.tracks.items
        if (itemsList.length === 0) return

        const id = itemsList[0].id
        const name = itemsList[0].name
        const mainArtist = itemsList[0].artists[0].name
        const img = itemsList[0].album.images[0].url
        

        return {'id': id, 'name': name, 'artist':mainArtist, 'img':img}
    }

    const _getTrack = async (token, trackId) => {
        const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + token}
        });

            const data = await res.json();
            return data.external_urls.spotify;
    }

    return {
        getAccessToken(){
            return _getAccessToken();
        },
        getTrackInfo(token, trackName){
            return _getTrackInfo(token, trackName);
        },
        getTrack(token, trackId){
            return _getTrack(token, trackId);
        }
    }
})();

const UIController = (function(){
    const DOMElements = {
        searchInput: "#search-input",
        searchBtn: '#search-btn',
        btnLink: '#btn-link',
        searchIcon: '#search-icon',
        resultField: '#result',
        playFrame: '#play-frame',
        mainSection: '#main-section',
        title: '#title'
    }

    const _getInput = async () => {
        const input = document.querySelector(DOMElements.searchInput)
        return input.value
    }

    const _hideButton = async () => {
        const btn = document.querySelector(DOMElements.btnLink)
        btn.classList.add('hide-btn')
    }

    const _hideFrame = async () => {
        const frame = document.querySelector(DOMElements.playFrame)
        frame.style.opacity = '0'
    }

    const _updateSearchIcon = async () => {
        const searchIcon = document.querySelector(DOMElements.searchIcon)
        searchIcon.classList.add('update-color') 
    }

    const _replaceColor = async () => {
        const main = document.querySelector(DOMElements.mainSection)
        const input = document.querySelector(DOMElements.searchInput)
        const searchBtn = document.querySelector(DOMElements.searchBtn)
        const searchIcon = document.querySelector(DOMElements.searchIcon)
        const resField = document.querySelector(DOMElements.resultField)
        const title = document.querySelector(DOMElements.title)
        const bgColor = document.documentElement.style.getPropertyValue('--off-white')
        const blueColor = document.documentElement.style.getPropertyValue('--blue')

        main.style.background = bgColor
        input.style.background = bgColor
        searchIcon.style.color = blueColor
        resField.style.color = blueColor
        input.style.boxShadow = '9px 11px 6px -4px rgba(144, 180, 252,0.1)'
        input.style.color = blueColor
        title.style.opacity = '1'
        searchBtn.style.background = bgColor
    }

    return{
        getDom(){
            return DOMElements
        },
        getInput(){
            return _getInput()
        },
        hideButton(){
            return _hideButton()
        },
        hideFrame(){
            return _hideFrame()
        },
        updateSearchIcon(){
            return _updateSearchIcon()
        },
        replaceColor(){
            return _replaceColor()
        }
    }
})();

const APPController = (function(APICtrl, UICtrl){
    const getTrackUrl = async () => {
        const token = await APICtrl.getAccessToken()
        const trackInput = await UICtrl.getInput()
        if (trackInput == '') return
        const trackinfo = await APICtrl.getTrackInfo(token, trackInput)
        if (typeof trackinfo == 'undefined') return
        const trackid = trackinfo['id']
        const trackLink = await APICtrl.getTrack(token, trackid)
        return trackLink
    }

    const showButton = async () => {
        const trackLink = await getTrackUrl()
        const btn = document.querySelector(UICtrl.getDom().btnLink)
        btn.href = trackLink
        btn.classList.remove('hide-btn')
    }

    const changeBgColor = async () => {
        const token = await APICtrl.getAccessToken()
        const trackInput = await UICtrl.getInput()
        if(trackInput == '') return
        const trackinfo = await APICtrl.getTrackInfo(token, trackInput)
        if (typeof trackinfo == 'undefined') return
        const img = trackinfo['img']

        Vibrant.from(img).getPalette((err, palette) => {
            const lightVibrant = palette.Vibrant.getRgb()
            const muted = palette.Muted.getRgb()

            const mainSect = document.querySelector(UICtrl.getDom().mainSection)
            const searchInput = document.querySelector(UICtrl.getDom().searchInput)
            const searchBtn = document.querySelector(UICtrl.getDom().searchBtn)
            const btn = document.querySelector(UICtrl.getDom().btnLink)
            const resField = document.querySelector(UICtrl.getDom().resultField)
            const title = document.querySelector(UICtrl.getDom().title)
            const searchIcon = document.querySelector(UICtrl.getDom().searchIcon)
    
            mainSect.style.background = 'rgba(' + lightVibrant.join(',') + ',' + 0.2 + ')';
            searchInput.style.background = 'rgba(' + lightVibrant.join(',') + ',' + 0.1 + ')';
            searchInput.style.boxShadow = '9px 11px 6px -4px rgba(' + lightVibrant.join(',') + ',' + 0.1 + ')';
            searchBtn.style.background = 'rgba(' + lightVibrant.join(',') + ',' + 0.001 + ')';
            btn.style.background = 'rgba(' + lightVibrant.join(',') + ',' + 0.2 + ')';
            resField.style.color = 'rgb(' + muted.join(',') + ')';
            searchIcon.style.color = 'rgb(' + muted.join(',') + ')';
            searchInput.style.color = 'rgb(' + muted.join(',') + ')';

            title.style.opacity = '0'
            return lightVibrant
            })
    }

    const updateResult = async () => {
        const token = await APICtrl.getAccessToken()
        try{
            const trackInput = await UICtrl.getInput()
            const trackinfo = await APICtrl.getTrackInfo(token, trackInput)
            const trackName = trackinfo['name']
            const trackArtist = trackinfo['artist']
            const result = document.querySelector(UICtrl.getDom().resultField)
            result.innerHTML = `Song Found: ${trackName} by ${trackArtist}`
            showButton()
            embedTrack()
            return trackName
        }catch(e){
            const input = document.querySelector(UICtrl.getDom().searchInput)
            if (input.value != '') result.innerHTML = "Track Not Found. Try a Different Query."
        }
    }

    const embedTrack = async () => {
        const token = await APICtrl.getAccessToken()
        const trackInput = await UICtrl.getInput()
        if (trackInput == '') return
        const trackinfo = await APICtrl.getTrackInfo(token, trackInput)
        if (typeof trackinfo == 'undefined') return
        const trackid = trackinfo['id']
        const frame = document.querySelector(UICtrl.getDom().playFrame)
        frame.setAttribute('src', `https://open.spotify.com/embed/track/${trackid}?utm_source=generator`)
        frame.style.opacity = '1'
    }

    const runCode = async () => {
        const input = document.querySelector(UICtrl.getDom().searchInput)
        const searchBtn = document.querySelector(UICtrl.getDom().searchBtn)

        input.addEventListener('keyup', function(e){
            e.preventDefault()
            if(e.keyCode === 13){
                getTrackUrl()
                updateResult()
                changeBgColor()
            }
            if (input.value == '') {
                UICtrl.hideButton()
                UICtrl.hideFrame()
                UICtrl.replaceColor()
            }
        })

        input.oninput = function(){
            UICtrl.updateSearchIcon()
        }

        input.addEventListener('keyup', function(e){
            e.preventDefault()
            if (input.value === ''){
                updateResult()
                const result = document.querySelector(UICtrl.getDom().resultField)
                result.innerHTML = ''
                const searchIcon = document.querySelector(UICtrl.getDom().searchIcon)
                searchIcon.classList.remove('update-color')
            }
        })
    }


    return {
        init(){
            runCode();
            console.log("Application Running")
        }
    }
})(APIController, UIController);


APPController.init()



