rooster = (function() {

  const id = 'rooster';

  const p = navigator.platform;
  const isIOS =  ( p === 'iPad' || p === 'iPhone' || p === 'iPod' );

  // IOS doesn't support audio autoplay
  if(!isIOS) {
    const audioElem = $('<audio id="'
    + id +
    '" src="resources/sounds/rooster.wav" controls preload="auto" autobuffer style="display: none"/>');
    audioElem.appendTo($("body"));
  }

  return {

    play : function(){
      if(audioElem) {
        const element = audioElem[0];
        if(element && 'function' == typeof(element.play)){
          element.play();
        } else {
          console.warn("cannot play rooster ");
        }
      }
    }

  };

})();
