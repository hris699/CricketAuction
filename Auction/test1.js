async function init() {
    let i = 0;
    while(i<2){
    console.log(1);
    await sleep(2000);
    console.log(2);
    }
  }
  
  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
init();