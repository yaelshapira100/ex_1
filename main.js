console.log("Hello World!");
setupCounter();

function setupCounter() {
  let count = 0;

  function increment() {
    count++;
    document.querySelector("#count").innerHTML = count;
  }

  function decrement() {
    count--;
    document.querySelector("#count").innerHTML = count;
  }

  document.querySelector("#increment").addEventListener("click", increment);
  document.querySelector("#decrement").addEventListener("click", decrement);
}
