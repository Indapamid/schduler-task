let btnTheam = document.getElementById("theme-button");
let divWrapper = document.querySelector('.page')

btnTheam.addEventListener("click", () => {
  divWrapper.classList.toggle('light-theme');
  divWrapper.classList.toggle('dark-theme');
});