
module.exports = function getCurrentDate() {
    var currentdate = new Date(); 
    var d = Date(
        currentdate.getFullYear(), 
        currentdate.getMonth(), 
        currentdate.getDate(),
        currentdate.getHours(),
        currentdate.getMinutes(),
        currentdate.getSeconds()
    );
    return d;
}