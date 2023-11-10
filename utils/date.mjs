function setMonday() {
  var day = this.getDay(),
    diff = this.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  this.setDate(diff);
}
function setSunday(d) {
  var day = this.getDay(),
    diff = 6 + this.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
  this.setDate(diff);
}

Date.prototype.setMonday = setMonday;
Date.prototype.setSunday = setSunday;
