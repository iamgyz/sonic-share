var SonicCoder = require('./sonic-coder.js');

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new window.AudioContext();
/**
 * Encodes text as audio streams.
 *
 * 1. Receives a string of text.
 * 2. Creates an oscillator.
 * 3. Converts characters into frequencies.
 * 4. Transmits frequencies, waiting in between appropriately.
 */
function SonicSocket(params) {
  params = params || {};
  this.coder = params.coder || new SonicCoder();
  this.charDuration = params.charDuration || 0.2;//一個bit傳200ms
  this.coder = params.coder || new SonicCoder(params);
  this.rampDuration = params.rampDuration || 0.001;
}

//input is a 8-bit array [10101010]
SonicSocket.prototype.sendByte = function(input, opt_callback) {
  //send start signal (freq.min+100) 18500+100 = 18600 khz
  var freq = this.coder.freqMin+100;
  var time = audioContext.currentTime;
  this.scheduleToneAt(freq, time, this.charDuration);

  //send bits (payload)
  /*
   * 0: freq.min + 300 = 18500 + 300 = 18800 khz
   * 1: freq.min + 700 = 18500 + 700 = 19200 khz
   */
  for (var i = 0; i < input.length; i++) {
    if(input[i] == 0){
        freq = this.coder.freqMin+300;
    }else{
        freq = this.coder.freqMin+700;
    }
    time = audioContext.currentTime + this.charDuration * (i+1);
    this.scheduleToneAt(freq, time, this.charDuration);
  }

  //send end signal (freq.min+900) = 18500+900 = 19400
  freq = this.coder.freqMin+900;
  time = audioContext.currentTime + this.charDuration * 9;
  this.scheduleToneAt(freq, time, this.charDuration);


  // If specified, callback after roughly the amount of time it would have
  // taken to transmit the token.
  if (opt_callback) {
    var totalTime = this.charDuration * 9;
    setTimeout(opt_callback, totalTime * 1000);
  }
};

SonicSocket.prototype.send = function(input, opt_callback) {
  // Surround the word with start and end characters.
  input = this.coder.startChar + input + this.coder.endChar;
  // Use WAAPI to schedule the frequencies.
  for (var i = 0; i < input.length; i++) {
    var char = input[i];
    var freq = this.coder.charToFreq(char);
    var time = audioContext.currentTime + this.charDuration * i;
    this.scheduleToneAt(freq, time, this.charDuration);
  }

  // If specified, callback after roughly the amount of time it would have
  // taken to transmit the token.
  if (opt_callback) {
    var totalTime = this.charDuration * input.length;
    setTimeout(opt_callback, totalTime * 1000);
  }
};

SonicSocket.prototype.scheduleToneAt = function(freq, startTime, duration) {
  var gainNode = audioContext.createGain();
  // Gain => Merger
  gainNode.gain.value = 0;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(1, startTime + this.rampDuration);
  gainNode.gain.setValueAtTime(1, startTime + duration - this.rampDuration);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

  gainNode.connect(audioContext.destination);

  var osc = audioContext.createOscillator();
  osc.frequency.value = freq;
  osc.connect(gainNode);

  osc.start(startTime);
};

module.exports = SonicSocket;
