var svg = document.querySelector('svg'), 
    r, s, w, h, 
    vb = svg.getAttribute('viewBox').split(' '), 
    vb_w = ~~vb[2], vb_h = ~~vb[3], 
    vb_x = ~~vb[0], vb_y = ~~vb[1], 
    ctrl_pts = {}, 
    chord = svg.querySelector('.string'), 
    dragging = false, dragged = null, 
    mid_pt = {};

var getCtrlType = function(str) {
  return str.match(/ctrl\-\-[a-z]*/)[0].split('--')[1];
};

var initSVGCanvas = function() {
  r = svg.getBoundingClientRect();
  s = getComputedStyle(svg);
  w = ~~s.width.split('px')[0];
  h = ~~s.height.split('px')[0];
};

var initDemo = function() {
  var ctrl_els = svg.querySelectorAll('.ctrl'), 
      n = ctrl_els.length, 
      type;
  
  for(var i = 0; i < n; i++) {
    type = getCtrlType(ctrl_els[i].className.baseVal);
    
    ctrl_pts[type] = {};
    ctrl_pts[type].el = ctrl_els[i];
    ctrl_pts[type].coord = {
      'x': ctrl_els[i].getAttribute('cx'), 
      'y': ctrl_els[i].getAttribute('cy')
    };
  }
  
  modifyString();
};

var modifyString = function(o) {
  var d = 'M';
  
  d += (ctrl_pts['start'].coord.x || -400) + ' ' + 
    	(ctrl_pts['start'].coord.y || 0) + ' Q' + 
    	(ctrl_pts['mid'].coord.x || 0) + ' ' + 
    	(ctrl_pts['mid'].coord.y || 0) + ', ' + 
    	(ctrl_pts['end'].coord.x || 400) + ' ' + 
    	(ctrl_pts['end'].coord.y || 0);
  
  chord.setAttribute('d', d);
};

var moveControlPoint = function(e) {
  var x = Math.round((e.clientX - r.left)*vb_w/w + vb_x), 
      y = Math.round((e.clientY - r.top)*vb_h/h + vb_y), 
      ctrl_point_type = getCtrlType(dragged.className.baseVal), 
      v_pt = {};
    
  dragged.setAttribute('cx', x);
  dragged.setAttribute('cy', y);
  
  if(ctrl_point_type === 'mid') {
    x = 2*x - (1*ctrl_pts.start.coord.x + 1*ctrl_pts.end.coord.x)/2;
    y = 2*y - (1*ctrl_pts.start.coord.y + 1*ctrl_pts.end.coord.y)/2;
  }
  
  ctrl_pts[ctrl_point_type].coord = { 'x': x, 'y': y };
  
  if(ctrl_point_type === 'start' || ctrl_point_type === 'end') {
    v_pt = ctrl_pts['mid'].coord;
    mid_pt.x = (1*ctrl_pts.start.coord.x + 1*ctrl_pts.end.coord.x)/2;
    mid_pt.y = (1*ctrl_pts.start.coord.y + 1*ctrl_pts.end.coord.y)/2;
        
    ctrl_pts['mid'].el.setAttribute('cx', (1*v_pt.x + 1*mid_pt.x)/2);
    ctrl_pts['mid'].el.setAttribute('cy', (1*v_pt.y + 1*mid_pt.y)/2);
  }
  
  modifyString();
};

initSVGCanvas();
initDemo();

addEventListener('mousedown', function(e) {
  var t = e.target;
  
  /* not using classList because IE :( */
  /* bug filed: */
  /* https://connect.microsoft.com/IE/feedback/details/1046039 */
  if(t.className.baseVal.indexOf('ctrl') != -1) {
    dragging = true;
    dragged = t;
  }
}, false);

addEventListener('mouseup', function() {  
  dragging = false;
  dragged = null;
}, false);

addEventListener('mousemove', function(e) {  
  if(dragging) { moveControlPoint(e); }
}, false);

addEventListener('resize', initSVGCanvas, false);