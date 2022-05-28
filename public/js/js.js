

/*    Upload image in Contact   */
let uploadImage = function (event) {
    let img = document.getElementById('img');
    img.src = URL.createObjectURL(event.target.files[0]);
};


/*      To do select input (search)     */
function showDiv(select) {
    let searchInputs = document.getElementsByClassName("search-inputs");
    if (select.value == 1) {
        searchInputs[0].style.display = "none";
        searchInputs[1].style.display = "none";
    } else if (select.value == 2) {
        searchInputs[0].style.display = "flex";
        searchInputs[1].style.display = "none";
    } else {
        searchInputs[0].style.display = "none";
        searchInputs[1].style.display = "flex";
    }
}