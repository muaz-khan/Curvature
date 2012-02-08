 /***********************************
    Curvature is a designer for curving. It generates Canvas 2d APIs relevant code in different forms. It gives you full control over Bezier curves.
    http://dashingquill.web.officelive.com/Tools/Curvature.html
 http://dashingquill.web.officelive.com/2012/Curvature.html
    Developed by Muaz Khan - http://twitter.com/muazkh
***********************************/
 (function() {
     /* Global Variables */
     var
    doc = window.document,

     /* is touch compatible device? */
    isTouch = 'createTouch' in doc,

     /* Find element (s) using query selector */
    find = function (selector) {
         return doc.querySelector(selector);
     },

     /* Designer Context is the main context that allows dragging the curves! */
    designerContext = find('#designer-canvas').getContext('2d'),

     /* Backward canvas stores previous curves! */
    backwardContext = find('#backward-canvas').getContext('2d'),
    tempContext = find('#temp-canvas').getContext('2d'),

     /* Used for circles: "first-circle", "second-circle", "third-circle" and "fourth-circle" */
    circle = {
         firstCircle: false,
         secondCircle: false,
         thirdCircle: false,
         fourthCircle: false,
         any: function () {
             return this.firstCircle || this.secondCircle || this.thirdCircle || this.fourthCircle;
         },
         defaults: function () {
             this.firstCircle = this.secondCircle = this.thirdCircle = this.fourthCircle = false;
         }
     },

     /* The object stores the coordinates for all drawing: circles and curves */
    circlePoints = {
         firstX: 200, firstY: 300,
         secondX: 300, secondY: 100,
         thirdX: 600, thirdY: 100,
         fourthX: 700, fourthY: 300
     },
    bezierPoints = {
         startingX: 190, startingY: 300,
         firstX: 350, firstY: 150,
         secondX: 550, secondY: 150,
         endingX: 690, endingY: 300
     },

     /* absolute or relative coordinates */
    isAbsolute = false,
    isRelative = true,

     /* menu buttons */
    btnNewCurve = find('#new-curve'),
    btnOptions = find('#expand-options'),
    btnHelp = find('#help'),
    btnUndo = find('#undo'),
    btnHideShow = find('#hide-show'),
    btnAlignPoints = find('#align-points-redButton'),
    isOptionsPopupVisible = false,
    isMakeRelevantXYPoints = false,

     /* Arrays for storing absolute/relative coordinates */
    relativeCurvesPoints = [],
    relativeMoveToPoints = [],
    absoluteCurvesPoints = [[0, 0]],
    absoluteMoveToPoints = [[0, 0]],
    isNoClearRect = false,

     /* While creating new curves: swap previous moveTo x-y coordinates and endingPoints coordinates; - helpful when designing complex shapes! */
    isReplaceMoveToPointsWithEndingPoints = false,

     /* If checked, calling context.fill() too */
    isfillColor = false,

    isDragWholeCurve = false,
    previousPoints = [0, 0],

    isDragWholeDrawing = false,

    textArea = find('#text-area'),

    align = {
         isStartingPoints: true,
         isEndingPoints: true,
         isFirstControlPoints: true,
         isSecondControlPoints: true,
         isAll: function () {
             return this.isStartingPoints && this.isEndingPoints && this.isFirstControlPoints && this.isSecondControlPoints;
         },
         isAny: function () {
             return this.isStartingPoints || this.isEndingPoints || this.isFirstControlPoints || this.isSecondControlPoints;
         },
         checkAll: function () {
             this.isStartingPoints = this.isEndingPoints = this.isFirstControlPoints = this.isSecondControlPoints = true;
         },
         uncheckAll: function () {
             this.isStartingPoints = this.isEndingPoints = this.isFirstControlPoints = this.isSecondControlPoints = false;
         },
         isDefaultAlignPoints: true,
         isHorizontally: true,
         customPoint: 0
     },
     isAlignOptionsPopupVisible = false,

     isCopyAllCurves = false,
     copy = { bezierPoints: [], startingPoints: [] },

     shortenCode = false;

     function defaults() {
         /* Document-Level events */
         designerContext.canvas.addEventListener(isTouch ? 'touchstart' : 'mousedown', mouseDown, false);
         designerContext.canvas.addEventListener(isTouch ? 'touchmove' : 'mousemove', mouseMove, false);
         designerContext.canvas.addEventListener(isTouch ? 'touchend' : 'mouseup', mouseUp, false);
         doc.addEventListener('keyup', keyUp, false);

         /* Button-Level events */
         btnNewCurve.addEventListener(isTouch ? 'touchstart' : 'click', newCurve, false);
         btnOptions.addEventListener(isTouch ? 'touchstart' : 'click', expandOptions, false);
         btnHelp.addEventListener(isTouch ? 'touchstart' : 'click', btnHelpClick, false);
         btnUndo.addEventListener(isTouch ? 'touchstart' : 'click', btnUndoClick, false);
         btnHideShow.addEventListener(isTouch ? 'touchstart' : 'click', btnHideShowClick, false);
         btnAlignPoints.addEventListener(isTouch ? 'touchstart' : 'click', alginCurves, false);
         document.body.addEventListener(isTouch ? 'touchstart' : 'click', bodyClick, false);

         find('#options-popup').addEventListener(isTouch ? 'touchstart' : 'click', optionsPopupClick, false);
         find('#align-options-popup').addEventListener(isTouch ? 'touchstart' : 'click', alignOptionsPopupClick, false);
         find('#expand-align-options').addEventListener(isTouch ? 'touchstart' : 'click', expandAlignOptionsClick, false);

         /* Setting width/height for both canvas */
         designerContext.canvas.width = backwardContext.canvas.width = tempContext.canvas.width = innerWidth;
         designerContext.canvas.height = backwardContext.canvas.height = tempContext.canvas.height = innerHeight;

         /* Setting width/height for textarea */
         textArea.style.width = (innerWidth - 60) + 'px';
         textArea.style.height = (innerHeight / 4) + 'px';

         /* Default properties for designer canvas! */
         designerContext.strokeStyle = tempContext.strokeStyle = 'yellow';
         designerContext.font = '20px Verdana, Arial';
         designerContext.lineWidth = tempContext.lineWidth = 2;

         /* First of all: generating absolute coordinates */
         handleDrawing(0, 0, designerContext);
         /* Then getting relative coordinates from absolute coordinates */
         convertToRelativeCoordinates();
         /* Then rendering relative coordinates in the textbox – because relative coordinates are default for Curvature */
         getAllCurves();
     }
     defaults();

     function fillColor(isMouseOver, context, text, pageX, pageY) {
         context.beginPath();
         if (isMouseOver) {
             context.fillStyle = 'white';
             context.fillText(text + ' (' + (pageX - 10) + ', ' + pageY + ')', pageX + 10, pageY + 10);
             context.fillStyle = 'rgba(255, 255, 0, .8)';
         }
         else context.fillStyle = 'transparent';
     }

     function drawCircle(context, x, y) {
         context.moveTo(x, y);
         context.arc(x - 10, y, 10, 0, Math.PI * 2, false);
         context.closePath();
         context.fill();
         context.stroke();
     }

     /* Handle Drawing: the main function which handles all drawing! */
     function handleDrawing(pageX, pageY, context) {
         context.clearRect(0, 0, 50000, 50000);

         fillColor(circle.firstCircle, context, 'moveTo', pageX, pageY);
         drawCircle(context, circlePoints.firstX, circlePoints.firstY);

         fillColor(circle.secondCircle, context, '1st Control Point', pageX, pageY);
         drawCircle(context, circlePoints.secondX, circlePoints.secondY);

         fillColor(circle.thirdCircle, context, '2nd Control Point', pageX, pageY);
         drawCircle(context, circlePoints.thirdX, circlePoints.thirdY);

         fillColor(circle.fourthCircle, context, 'Ending Point', pageX, pageY);
         drawCircle(context, circlePoints.fourthX, circlePoints.fourthY);

         /* Drawing the Bezier curve! */
         context.beginPath();
         context.moveTo(bezierPoints.startingX, bezierPoints.startingY);
         context.bezierCurveTo(bezierPoints.firstX, bezierPoints.firstY, bezierPoints.secondX, bezierPoints.secondY, bezierPoints.endingX, bezierPoints.endingY);
         context.stroke();

         /* <input id="is-fill-color" type="checkbox" /> */
         if (isfillColor) {
             context.fillStyle = 'rgba(255, 255, 0, .8)';
             context.fill();
         }

         absoluteMoveToPoints[absoluteMoveToPoints.length - 1] = [bezierPoints.startingX, bezierPoints.startingY];
         absoluteCurvesPoints[absoluteCurvesPoints.length - 1] = [bezierPoints.firstX, bezierPoints.firstY, bezierPoints.secondX, bezierPoints.secondY, bezierPoints.endingX, bezierPoints.endingY];

         /* <input id="do-not-clear-rect" type="checkbox" /> */
         if (isNoClearRect && pageX !== 0) {
             backwardContext.lineWidth = 2;
             backwardContext.strokeStyle = 'yellow';
             backwardContext.beginPath();
             backwardContext.moveTo(bezierPoints.startingX, bezierPoints.startingY);
             backwardContext.bezierCurveTo(bezierPoints.firstX, bezierPoints.firstY, bezierPoints.secondX, bezierPoints.secondY, bezierPoints.endingX, bezierPoints.endingY);
             backwardContext.stroke();

             /* Saving absolute coordinates! */
             absoluteMoveToPoints[absoluteMoveToPoints.length] = [bezierPoints.startingX, bezierPoints.startingY];
             absoluteCurvesPoints[absoluteCurvesPoints.length] = [bezierPoints.firstX, bezierPoints.firstY, bezierPoints.secondX, bezierPoints.secondY, bezierPoints.endingX, bezierPoints.endingY];
         }         
         getAllCurves();
     }

     /* Firing mouse-up event – so to stop dragging the curve! */
     function mouseUp(e) {
         e.preventDefault();
         if (isTouch) e = e.pageX ? e : e.touches.length ? e.touches[0] : { pageX: 0, pageY: 0 };
        
         var pageX = e.pageX - designerContext.canvas.offsetLeft, 
            pageY = e.pageY - designerContext.canvas.offsetTop;

         clearCopiedCurves();

         circle.defaults();
         handleDrawing(pageX, pageY, designerContext);
     }

     function clearCopiedCurves() {
         if (!isCopyAllCurves) return;
         absoluteCurvesPoints = copy.bezierPoints.concat(absoluteCurvesPoints);
         absoluteMoveToPoints = copy.startingPoints.concat(absoluteMoveToPoints);

         redrawBackwardCanvas();
         convertToRelativeCoordinates();

         isCopyAllCurves = find('#copy-current-drawing').checked = find('#drag-whole-drawing').checked = isDragWholeDrawing = false;
         tempContext.clearRect(0, 0, 50000, 50000);
     }

     function onDrag(pageX, pageY, isWholeCurve) {         
         var x = previousPoints[0], y = previousPoints[1], positiveX = pageX >= x, positiveY = pageY >= y, value;
        
         if (positiveX) {
             value = pageX - x;

             if (circle.firstCircle || isWholeCurve) {
                 circlePoints.firstX += value;
                 bezierPoints.startingX += value;                
             }
             if (circle.secondCircle || isWholeCurve) {
                 circlePoints.secondX += value;
                 bezierPoints.firstX += value;                
             }
             if (circle.thirdCircle || isWholeCurve) {
                 circlePoints.thirdX += value;
                 bezierPoints.secondX += value;
             }
             if (circle.fourthCircle || isWholeCurve) {
                 circlePoints.fourthX += value;
                 bezierPoints.endingX += value;
             }
         }
         else {
             value = x - pageX;

             if (circle.firstCircle || isWholeCurve) {
                 circlePoints.firstX -= value;
                 bezierPoints.startingX -= value;
             }

             if (circle.secondCircle || isWholeCurve) {
                 circlePoints.secondX -= value;
                 bezierPoints.firstX -= value;
             }

             if (circle.thirdCircle || isWholeCurve) {
                 circlePoints.thirdX -= value;
                 bezierPoints.secondX -= value;
             }

             if (circle.fourthCircle || isWholeCurve) {
                 circlePoints.fourthX -= value;
                 bezierPoints.endingX -= value;
             }
         }

         if (positiveY) {
             value = pageY - y;

             if (circle.firstCircle || isWholeCurve) {                
                 circlePoints.firstY += value;
                 bezierPoints.startingY += value;
             }

             if (circle.secondCircle || isWholeCurve) {
                 circlePoints.secondY += value;
                 bezierPoints.firstY += value;
             }

             if (circle.thirdCircle || isWholeCurve) {
                 circlePoints.thirdY += value;
                 bezierPoints.secondY += value;
             }

             if (circle.fourthCircle || isWholeCurve) {
                 circlePoints.fourthY += value;
                 bezierPoints.endingY += value;
             }
         }
         else {
             value = y - pageY;

             if (circle.firstCircle || isWholeCurve) {
                 circlePoints.firstY -= value;
                 bezierPoints.startingY -= value;
             }

             if (circle.secondCircle || isWholeCurve) {
                 circlePoints.secondY -= value;
                 bezierPoints.firstY -= value;
             }

             if (circle.thirdCircle || isWholeCurve) {
                 circlePoints.thirdY -= value;
                 bezierPoints.secondY -= value;
             }

             if (circle.fourthCircle || isWholeCurve) {
                 circlePoints.fourthY -= value;
                 bezierPoints.endingY -= value;
             }
         }

         previousPoints = [pageX, pageY];

         convertToRelativeCoordinates();

         handleDrawing(pageX, pageY, designerContext);
     }

     function onDragWholeDrawing(pageX, pageY) {        
         var x = previousPoints[0], y = previousPoints[1], positiveX = pageX >= x, positiveY = pageY >= y, value;

         var length = absoluteCurvesPoints.length;
         for (var i = 0 ; i < length; i++) {
             if (positiveX) {
                 value = pageX - x;

                 absoluteMoveToPoints[i][0] += value;
                 absoluteCurvesPoints[i][0] += value;
                 absoluteCurvesPoints[i][2] += value;
                 absoluteCurvesPoints[i][4] += value;                
             }
             else {
                 value = x - pageX;

                 absoluteMoveToPoints[i][0] -= value;
                 absoluteCurvesPoints[i][0] -= value;
                 absoluteCurvesPoints[i][2] -= value;
                 absoluteCurvesPoints[i][4] -= value;                
             }

             if (positiveY) {
                 value = pageY - y;

                 absoluteMoveToPoints[i][1] += value;
                 absoluteCurvesPoints[i][1] += value;
                 absoluteCurvesPoints[i][3] += value;
                 absoluteCurvesPoints[i][5] += value;
             }
             else {
                 value = y - pageY;

                 absoluteMoveToPoints[i][1] -= value;
                 absoluteCurvesPoints[i][1] -= value;
                 absoluteCurvesPoints[i][3] -= value;
                 absoluteCurvesPoints[i][5] -= value;
             }
         }

         redrawBackwardCanvas();

         onDrag(pageX, pageY, true)
     }
     function redrawBackwardCanvas(context, startingPoints, bezierPoints) {
         context = context || backwardContext;
         startingPoints = startingPoints || absoluteMoveToPoints;
         bezierPoints = bezierPoints || absoluteCurvesPoints;

         context.clearRect(0, 0, 50000, 50000);
         context.beginPath();
         var length = bezierPoints.length;
         for (var i = 0; i < length; i++) {
             context.moveTo(startingPoints[i][0], startingPoints[i][1]);
             var c = bezierPoints[i];
             context.bezierCurveTo(c[0], c[1], c[2], c[3], c[4], c[5]);
         }
         context.stroke();
     }

     /* Getting realive x/y coordinates */
     function getRelativePoints(point, topPoint, varName) {
         if (point > topPoint) point = varName + ' + ' + (point - topPoint);
         else if (point < topPoint) point = varName + ' - ' + (topPoint - point);
         else point = varName;

         return point;
     }

     function convertToRelativeCoordinates() {
         var mPoints = absoluteMoveToPoints, cPoints = absoluteCurvesPoints, length = cPoints.length;

         var curvesPoints, movetoPoints, top = { moveToX: 0, moveToY: 0, firstX: 0, firstY: 0, secondX: 0, secondY: 0, endingX: 0, endingY: 0 };
         for (var i = 0; i < length; i++) {
             if (i == 0) {
                 top = {
                     moveToX: mPoints[i][0], moveToY: mPoints[i][1],
                     firstX: cPoints[i][0], firstY: cPoints[i][1],
                     secondX: cPoints[i][2], secondY: cPoints[i][3],
                     endingX: cPoints[i][4], endingY: cPoints[i][5]
                 };
                 if (!isMakeRelevantXYPoints) {
                     movetoPoints = 'var startingX = ' + top.moveToX + ', startingY = ' + top.moveToY + ', firstX = ' + top.firstX + ', firstY = ' + top.firstY + ', secondX = ' + top.secondX + ', secondY = ' + top.secondY + ', endingX = ' + top.endingX + ', endingY = ' + top.endingY + ';\n';
                     curvesPoints = 'context.moveTo( startingX, startingY );\n' + 'context.bezierCurveTo( firstX, firstY, secondX, secondY, endingX, endingY );';
                 }
                 else {
                     movetoPoints = 'var startingX = ' + top.moveToX + ', startingY = ' + top.moveToY + ';\n';
                     curvesPoints = 'context.moveTo( startingX, startingY );\n'
                                                + 'context.bezierCurveTo( '
                                                + getRelativePoints(cPoints[i][0], top.moveToX, 'startingX') + ', '
                                                + getRelativePoints(cPoints[i][1], top.moveToY, 'startingY') + ', '
                                                + getRelativePoints(cPoints[i][2], top.moveToX, 'startingX') + ', '
                                                + getRelativePoints(cPoints[i][3], top.moveToY, 'startingY') + ', '
                                                + getRelativePoints(cPoints[i][4], top.moveToX, 'startingX') + ', '
                                                + getRelativePoints(cPoints[i][5], top.moveToY, 'startingY') + ' );';
                 }
             }
             else {
                 movetoPoints = 'context.moveTo( ' + getRelativePoints(mPoints[i][0], top.moveToX, 'startingX') + ', ' + getRelativePoints(mPoints[i][1], top.moveToY, 'startingY') + ' )';
                 if (!isMakeRelevantXYPoints) {                    
                     curvesPoints = 'context.bezierCurveTo( '
                                + getRelativePoints(cPoints[i][0], top.firstX, 'firstX') + ', '
                                + getRelativePoints(cPoints[i][1], top.firstY, 'firstY') + ', '
                                + getRelativePoints(cPoints[i][2], top.secondX, 'secondX') + ', '
                                + getRelativePoints(cPoints[i][3], top.secondY, 'secondY') + ', '
                                + getRelativePoints(cPoints[i][4], top.endingX, 'endingX') + ', '
                                + getRelativePoints(cPoints[i][5], top.endingY, 'endingY') + ' );';
                 }
                 else {
                     curvesPoints = 'context.bezierCurveTo( '
                                + getRelativePoints(cPoints[i][0], top.moveToX, 'startingX') + ', '
                                + getRelativePoints(cPoints[i][1], top.moveToY, 'startingY') + ', '
                                + getRelativePoints(cPoints[i][2], top.moveToX, 'startingX') + ', '
                                + getRelativePoints(cPoints[i][3], top.moveToY, 'startingY') + ', '
                                + getRelativePoints(cPoints[i][4], top.moveToX, 'startingX') + ', '
                                + getRelativePoints(cPoints[i][5], top.moveToY, 'startingY') + ' );';
                 }
             }

             relativeMoveToPoints[i] = movetoPoints;
             relativeCurvesPoints[i] = curvesPoints;
         }
     }

     function mouseMove(e) {        
         e.preventDefault();
         if(isTouch) e = e.pageX ? e : e.touches.length ? e.touches[0] : {pageX: 0,pageY: 0};

         var pageX = e.pageX - designerContext.canvas.offsetLeft,
            pageY = e.pageY - designerContext.canvas.offsetTop;

         if (circle.any()) {
             if (isDragWholeCurve) onDrag(pageX, pageY, true);
             else if (isDragWholeDrawing) onDragWholeDrawing(pageX, pageY);
             else onDrag(pageX, pageY);
         }
         else {
             detectMouseDown(pageX, pageY);
             handleDrawing(pageX, pageY, designerContext);
             circle.defaults();
         }        
     }

     function detectMouseDown(pageX, pageY) {
         /* The expected coordinates for "first circle"! */
         if (pageX > circlePoints.firstX - 20 && pageX < circlePoints.firstX && pageY > circlePoints.firstY - 10 && pageY < circlePoints.firstY + 10) {
             circle.firstCircle = true;
         }

         /* The expected coordinates for "second circle"! */
         else if (pageX > circlePoints.secondX - 20 && pageX < circlePoints.secondX && pageY > circlePoints.secondY - 10 && pageY < circlePoints.secondY + 10) {
             circle.secondCircle = true;
         }

         /* The expected coordinates for "third circle"! */
         else if (pageX > circlePoints.thirdX - 20 && pageX < circlePoints.thirdX && pageY > circlePoints.thirdY - 10 && pageY < circlePoints.thirdY + 10) {
             circle.thirdCircle = true;
         }

         /* The expected coordinates for "fourth circle"! */
         else if (pageX > circlePoints.fourthX - 20 && pageX < circlePoints.fourthX && pageY > circlePoints.fourthY - 10 && pageY < circlePoints.fourthY + 10) {
             circle.fourthCircle = true;
         }
     }

     /* Firing mouse-down event – so to start dragging the curve! */
     function mouseDown(e) {
         e.preventDefault();
         if (isTouch) e = e.pageX ? e : e.touches.length ? e.touches[0] : { pageX: 0, pageY: 0 };

         /* Handle on which shape mouse is currently down so we can change coordinates and points accordingly! */
         var pageX = e.pageX - designerContext.canvas.offsetLeft, 
        pageY = e.pageY - designerContext.canvas.offsetTop;

         detectMouseDown(pageX, pageY);

         previousPoints = [pageX, pageY];
     }

     /* Handling key-up event */
     function keyUp(e) {
         e.preventDefault();

         if (e.keyCode === 78) {
             // "N" key for creating new curve
             newCurve();
         } 
         else if (e.keyCode === 85) {
             // "U" key for Undo
             btnUndoClick();
         }        
     }

     /* Getting all coordinates for all curves! – It is most useful part of Curvature! */
     function getAllCurves() {
         var innerHTML = '';
        
         if (isRelative) {

             /* Getting all drawn curves and displaying them in the <textarea>! */
             if (relativeCurvesPoints.length) {
                 var length = relativeCurvesPoints.length;
                 for (var i = 0; i < length; i++) {
                     innerHTML += relativeMoveToPoints[i] + '\n';
                     innerHTML += relativeCurvesPoints[i] + '\n\n';
                 }
             }            
         }
        
         if (isAbsolute) {
             innerHTML = '';
            
             length = absoluteCurvesPoints.length;
             for (i = 0; i < length; i++) {
                 var curve = absoluteCurvesPoints[i], moveTo = absoluteMoveToPoints[i];
                 innerHTML += 'context.moveTo( ' + moveTo[0] + ', ' + moveTo[1] + ' );\n';
                 innerHTML += 'context.bezierCurveTo( ' + curve[0] + ', ' + curve[1] + ', ' + curve[2] + ', ' + curve[3] + ', ' + curve[4] + ', ' + curve[5] + ' );\n\n';
             }
         }
         if (innerHTML.substr(innerHTML.length - 4, innerHTML.length) === '\n\n') innerHTML = innerHTML.substr(0, innerHTML.length - 4);
        
         /* Setting the value for <textarea>! */
         textArea.value = innerHTML;
        
         /* Displaying <textarea> and hiding all other section; if they are visible! */
         if (circle.any()) {
             textArea.parentNode.style.display = 'block';            
             find('#help-section').style.display = 'none';
         }
         /* focusing <textara>! */
         textArea.focus();

         if (shortenCode) shortenTheCode();
     }

     /* Creating new curve! */
     function newCurve() {
         backwardContext.strokeStyle = 'yellow';
         backwardContext.lineWidth = 2;

         /* Drawing "current curve" into backward canvas */
         backwardContext.beginPath();
         backwardContext.moveTo(bezierPoints.startingX, bezierPoints.startingY);
         backwardContext.bezierCurveTo(bezierPoints.firstX, bezierPoints.firstY, bezierPoints.secondX, bezierPoints.secondY, bezierPoints.endingX, bezierPoints.endingY);

         /* fillStyle will be used when "isFillColor" === true! */
         if (isfillColor) {
             backwardContext.fillStyle = 'rgba(255, 255, 0, .8)';
             backwardContext.fill();
         }
        
         backwardContext.stroke();
        
         absoluteMoveToPoints[absoluteMoveToPoints.length] = [bezierPoints.startingX, bezierPoints.startingY];
         absoluteCurvesPoints[absoluteCurvesPoints.length] = [bezierPoints.firstX, bezierPoints.firstY, bezierPoints.secondX, bezierPoints.secondY, bezierPoints.endingX, bezierPoints.endingY];
         convertToRelativeCoordinates();
         if (isReplaceMoveToPointsWithEndingPoints) {
             var tempX = bezierPoints.startingX, 
                tempY = bezierPoints.startingY, 
                tempCircleX = circlePoints.firstX, 
                tempCircleY = circlePoints.firstY;
            
             /* Swapping */
             bezierPoints.startingX = bezierPoints.endingX;
             bezierPoints.startingY = bezierPoints.endingY;
             bezierPoints.endingX = tempX;
             bezierPoints.endingY = tempY;
            
             circlePoints.firstX = circlePoints.fourthX;
             circlePoints.firstY = circlePoints.fourthY;
             circlePoints.fourthX = tempCircleX;
             circlePoints.fourthY = tempCircleY;
         }
         getAllCurves();
         handleDrawing(0, 0, designerContext);
     }

     /* Button to get relatively positioned coordinates for only-one curve! */
     function btnRelativeClick(e) {
         isAbsolute = false;
         isRelative = true;
         handleDrawing(e.pageX, e.pageY, designerContext);        
         find('#text-area').parentNode.style.display = 'none';
         find('#help-section').style.display = 'none';
        
         find('#is-absolute-points').checked = false;
     }

     /* Button to get absolutely positioned coordinates for only-one curve! */
     function btnAbsoluteClick(e) {
         isRelative = false;
         isAbsolute = true;
         handleDrawing(e.pageX, e.pageY, designerContext);        
         find('#text-area').parentNode.style.display = 'none';
         find('#help-section').style.display = 'none';
        
         find('#is-absolute-points').checked = true;
     }

     /* Help menu button click */
     function btnHelpClick() {
         var outputContainer = find('#output-container');
         outputContainer.style.marginTop = '0';
         find('#hide-show').innerHTML = 'Hide';

         find('#help-section').style.display = 'block';
         textArea.parentNode.style.display = 'none';
     }

     /* undo the previous curve! */
     function btnUndoClick() {
         clearCopiedCurves();
         if (absoluteCurvesPoints.length && absoluteMoveToPoints.length) {
             if (absoluteMoveToPoints.length > 1) absoluteMoveToPoints.length = relativeMoveToPoints.length = absoluteCurvesPoints.length = relativeCurvesPoints.length = absoluteCurvesPoints.length - 1;

             var lastMoveToPoint = absoluteMoveToPoints[absoluteMoveToPoints.length - 1], lastCurvePoint = absoluteCurvesPoints[absoluteCurvesPoints.length - 1];

             circlePoints = {
                 firstX:     lastMoveToPoint[0] + 10,     firstY: lastMoveToPoint[1],
                 secondX:    lastCurvePoint[0],      secondY: lastCurvePoint[1],
                 thirdX:     lastCurvePoint[2],      thirdY: lastCurvePoint[3],
                 fourthX:    lastCurvePoint[4] + 10,      fourthY: lastCurvePoint[5]
             };
             bezierPoints = {
                 startingX:  lastMoveToPoint[0],     startingY: lastMoveToPoint[1],
                 firstX:     lastCurvePoint[0],      firstY: lastCurvePoint[1],
                 secondX:    lastCurvePoint[2],      secondY: lastCurvePoint[3],
                 endingX:    lastCurvePoint[4],      endingY: lastCurvePoint[5]
             };

             handleDrawing(0, 0, designerContext);

             /* We have to change Backward Canvas too for the sake of clear undo effect! */
             redrawBackwardCanvas();
         }
     }

     /* Don't call clearRect; if this check is checked. */
     find('#do-not-clear-rect').onchange = function() {
         isNoClearRect = this.checked;
     };

     /* Replace moveTo point with ending point on new curves - It is the most useful when drawing complex shapes! */
     find('#replace-moveTo-points').onchange = function () {
         isReplaceMoveToPointsWithEndingPoints = this.checked;
     };

     find('#drag-whole-curve').onchange = function () {
         isDragWholeCurve = this.checked;
         if (isDragWholeDrawing) find('#drag-whole-drawing').checked = isDragWholeDrawing = false;
     };

    find('#drag-whole-drawing').onchange = function () {        
        isDragWholeDrawing = this.checked;
        if (isDragWholeCurve) find('#drag-whole-curve').checked = isDragWholeCurve = false;
        
    };

    /* If checked, call context.fill() on main canvas */
    find('#is-fill-color').onchange = function () {        
        isfillColor = this.checked;
        handleDrawing(0, 0, designerContext);
    };

    /* If end user is interested in absolute coordinates; he can check a checkbox! */
    find('#is-absolute-points').onchange = function () {
        isRelative = !this.checked;
        isAbsolute = this.checked;

        /* Calling these two methods to change all coordinates from relative to absolute! */
        handleDrawing(0, 0, designerContext);
        getAllCurves();        
    };

    function btnHideShowClick() {
        var outputContainer = find('#output-container'), textAreaHeight = (innerHeight / 4);
        textArea.style.height = textAreaHeight + 'px';
        textArea.parentNode.style.display = 'block';
        find('#help-section').style.display = 'none';

        if (this.innerHTML.indexOf('Hide') !== -1) {
            outputContainer.style.marginTop = '-'+ (textAreaHeight + 50) +'px';
            this.innerHTML = 'Show';
        } else {
            outputContainer.style.marginTop = '0';
            this.innerHTML = 'Hide';
        }
    }

    /* displaying options popup */
    function expandOptions() {
        var popup = find('#options-popup');
        popup.style.display = 'block';
        isOptionsPopupVisible = true;        
    }

    /* <BODY> click */
    function bodyClick(e) {
        if (isOptionsPopupVisible && e.target && e.target.id !== 'options-popup' && e.target.id !== 'expand-options') {
            var popup = find('#options-popup');
            popup.style.display = 'none';
            isOptionsPopupVisible = false;
        }
        if (isAlignOptionsPopupVisible && e.target && e.target.id !== 'expand-align-options') {
            var popup = find('#align-options-popup');
            popup.style.display = 'none';
            isAlignOptionsPopupVisible = false;
        }
    }

    function optionsPopupClick(e) {
        e.cancelBubble = true;
        e.bubbles = false;
    }
    function alignOptionsPopupClick(e) {
        e.cancelBubble = true;
        e.bubbles = false;
    }

    find('#make-relevant-xy-points').onchange = function () {
        isMakeRelevantXYPoints = this.checked;

        convertToRelativeCoordinates();
        getAllCurves();
    };

    function alginCurves() {
        if (!align.isAny()) return;

        customAlignPoints();

        var length = absoluteCurvesPoints.length;
        for (var i = 0; i < length; i++) {
            var startingX, startingY;

            if (align.isStartingPoints) {
                startingX = !align.isHorizontally
                            ? (align.isDefaultAlignPoints ? absoluteMoveToPoints[0][0] : align.customPoint)
                            : (align.isDefaultAlignPoints ? absoluteMoveToPoints[i][0] : align.customPoint);
                startingY = align.isHorizontally
                            ? (align.isDefaultAlignPoints ? absoluteMoveToPoints[0][1] : align.customPoint)
                            : (align.isDefaultAlignPoints ? absoluteMoveToPoints[i][1] : align.customPoint);
            }
            else {
                startingX = absoluteMoveToPoints[i][0];
                startingY = absoluteMoveToPoints[i][1]
            }
            absoluteMoveToPoints[i] = [startingX, startingY];

            var firstX, firstY, secondX, secondY, endingX, endingY, curve = absoluteCurvesPoints[i], topCurve = absoluteCurvesPoints[0];

            if (align.isFirstControlPoints) {
                firstX = !align.isHorizontally
                            ? (align.isDefaultAlignPoints ? topCurve[0] : align.customPoint)
                            : (align.isDefaultAlignPoints ? curve[0] : align.customPoint);
                firstY = align.isHorizontally
                            ? (align.isDefaultAlignPoints ? topCurve[1] : align.customPoint)
                            : (align.isDefaultAlignPoints ? curve [1] : align.customPoint);
            }
            else {
                firstX = curve[0];
                firstY = curve[1];
            }

            if (align.isSecondControlPoints) {
                secondX = !align.isHorizontally
                                ? (align.isDefaultAlignPoints ? topCurve[2] : align.customPoint)
                                : (align.isDefaultAlignPoints ? curve[2] : align.customPoint);
                secondY = align.isHorizontally
                                ? (align.isDefaultAlignPoints ? topCurve[3] : align.customPoint)
                                : (align.isDefaultAlignPoints ? curve[3] : align.customPoint);
            }
            else {
                secondX = curve[2];
                secondY = curve[3];
            }

            if (align.isEndingPoints) {
                endingX = !align.isHorizontally
                                ? (align.isDefaultAlignPoints ? topCurve[4] : align.customPoint)
                                : (align.isDefaultAlignPoints ? curve[4] : align.customPoint);
                endingY = align.isHorizontally
                                ? (align.isDefaultAlignPoints ? topCurve[5] : align.customPoint)
                                : (align.isDefaultAlignPoints ? curve[5] : align.customPoint);
            }
            else {
                endingX = curve[4];
                endingY = curve[5];
            }

            absoluteCurvesPoints[i] = [firstX, firstY, secondX, secondY, endingX, endingY];
        }

        length = length - 1;
        var absMoveToPointX = absoluteMoveToPoints[length][0], absMoveToPointY = absoluteMoveToPoints[length][1],
        absFirstX = absoluteCurvesPoints[length][0], absFirstY = absoluteCurvesPoints[length][1], absSecondX = absoluteCurvesPoints[length][2], absSecondY = absoluteCurvesPoints[length][3], absEndingX = absoluteCurvesPoints[length][4], absEndingY = absoluteCurvesPoints[length][5];
        circlePoints = {
            firstX: absMoveToPointX + 10, firstY: absMoveToPointY,
            secondX: absFirstX, secondY: absFirstY,
            thirdX: absSecondX, thirdY: absSecondY,
            fourthX: absEndingX + 10, fourthY: absEndingY
        };
        bezierPoints = {
            startingX: absMoveToPointX, startingY: absMoveToPointY,
            firstX: absFirstX, firstY: absFirstY,
            secondX: absSecondX, secondY: absSecondY,
            endingX: absEndingX, endingY: absEndingY
        };

        convertToRelativeCoordinates();
        handleDrawing(0, 0, designerContext);
        redrawBackwardCanvas();
    }

    function expandAlignOptionsClick() {
        var popup = find('#align-options-popup');
        popup.style.display = 'block';
        isAlignOptionsPopupVisible = true;
    }

    find('#align-vertically').onchange = function () {
        align.isHorizontally = !this.checked;
        find('#align-horizontally').checked = false;
    };

    find('#align-horizontally').onchange = function () {
        align.isHorizontally = this.checked;
        find('#align-vertically').checked = false;
    };

    find('#align-all').onchange = function () {
        var otherAlignOptions = find('#other-align-options'), checkboxes = document.querySelectorAll('#other-align-options input[type=checkbox]');

        if (this.checked) {            
            otherAlignOptions.style.opacity = '.4';
            for (var i = 0; i < checkboxes.length; i++) {
                checkboxes[i].setAttribute('disabled', 'true');
                checkboxes[i].checked = true;
            }
            align.checkAll();
        }
        else {
            otherAlignOptions.style.opacity = '1';            
            for (var i = 0; i < checkboxes.length; i++) {
                checkboxes[i].removeAttribute('disabled');
                checkboxes[i].checked = false;
            }
            align.uncheckAll();
        }
        customAlignPoints();
    };

    find('#default-align-points').onchange = function () {
        align.isDefaultAlignPoints = this.checked;
        customAlignPoints();
    };

    find('#custom-align-points').onchange = function () {
        align.isDefaultAlignPoints = !this.checked;
        customAlignPoints();
    };

    function customAlignPoints() {
        var textForCustomAlignPoints = find('#custom-align-points-text'), checkForCustomAlignPoints = find('#custom-align-points'), defaultAlignPoints = find('#default-align-points');

        textForCustomAlignPoints.parentNode.style.opacity = !align.isDefaultAlignPoints && align.isAny() ? 1 : .4;
        defaultAlignPoints.parentNode.style.opacity = align.isDefaultAlignPoints && align.isAny() ? 1 : .4;

        checkForCustomAlignPoints.checked = !align.isDefaultAlignPoints;
        defaultAlignPoints.checked = align.isDefaultAlignPoints;

        if (align.isAny() && !align.isDefaultAlignPoints) {
            textForCustomAlignPoints.removeAttribute('disabled');
            checkForCustomAlignPoints.removeAttribute('disabled');
            defaultAlignPoints.setAttribute('disabled', 'true');
        }
        else {
            textForCustomAlignPoints.setAttribute('disabled', 'true');
            checkForCustomAlignPoints.setAttribute('disabled', 'true');
            defaultAlignPoints.removeAttribute('disabled');
        }
        if(!align.isDefaultAlignPoints)
        {
            align.customPoint = parseInt(textForCustomAlignPoints.value) || 0;            
        }
    }
     find('#align-starting-points').onchange = function () {         
         align.isStartingPoints = this.checked;
         customAlignPoints();
    };
    find('#align-ending-points').onchange = function () {
        align.isEndingPoints = this.checked;
        customAlignPoints();
    };

    find('#align-first-control-points').onchange = function () {
        align.isFirstControlPoints = this.checked
        customAlignPoints();
    };

    find('#align-second-control-points').onchange = function () {
        align.isSecondControlPoints = this.checked;
        customAlignPoints();
    };

     find('#copy-current-drawing').onchange = function () {
         copy = { bezierPoints: [], startingPoints: [] };
         var length = absoluteMoveToPoints.length;
         if (length <= 1) {
             this.checked = false;
             newCurve();
             find('#drag-whole-curve').checked = isDragWholeCurve = true;
             return;
         };

         find('#drag-whole-curve').checked = isDragWholeCurve = false;

         isCopyAllCurves = find('#drag-whole-drawing').checked = isDragWholeDrawing = this.checked;
         if (isCopyAllCurves) {             
             for (var i = 0; i < length; i++) {
                 copy.startingPoints[i] = [absoluteMoveToPoints[i][0], absoluteMoveToPoints[i][1]];
                 copy.bezierPoints[i] = [absoluteCurvesPoints[i][0], absoluteCurvesPoints[i][1], absoluteCurvesPoints[i][2], absoluteCurvesPoints[i][3], absoluteCurvesPoints[i][4], absoluteCurvesPoints[i][5]];
             }
             redrawBackwardCanvas(tempContext);
         }
     };

     function shortenTheCode() {
         if (!shortenCode) return;

         var tempPoint = isRelative && relativeCurvesPoints.length && relativeCurvesPoints[0].split('\n'),
            startingPoints = isRelative ? relativeMoveToPoints : absoluteMoveToPoints,
            bezierPoints = isRelative ? relativeCurvesPoints : absoluteCurvesPoints,
            topPoints = isRelative ? startingPoints[0].replace(';', '') : startingPoints[0],
            length = bezierPoints.length, output,
            forLoop = 'for( var i = 0; i < length; i++ ) {\n\t' + 'context.moveTo( startingPoints[i][0], startingPoints[i][1] );\n\t' + 'context.bezierCurveTo( bezierPoints[i][0], bezierPoints[i][1], bezierPoints[i][2], bezierPoints[i][3], bezierPoints[i][4], bezierPoints[i][5] );\n' + '}';

         var startingPointsToString, bezierPointsToString;
         if (isRelative) {
             for (var i = 0; i < length; i++) {
                 if (i === 0) {
                     startingPointsToString = '[' + tempPoint[0].replace('context.moveTo(', '').replace(')', '').replace(';', '') + ']';
                     bezierPointsToString = '[' + tempPoint[1].replace('context.bezierCurveTo(', '').replace(')', '').replace(';', '') + ']';
                 }
                 else {
                     startingPointsToString += ', [' + startingPoints[i].replace('context.moveTo(', '').replace(')', '').replace(';', '') + ']';
                     bezierPointsToString += ', [' + bezierPoints[i].replace('context.bezierCurveTo(', '').replace(')', '').replace(';', '') + ']';
                 }
             }
             output = topPoints.replace('\n', ';\n') + 'var startingPoints = [' + startingPointsToString + '], bezierPoints = [' + bezierPointsToString + '], length = ' + length + ';\n' + forLoop;
         }
         else {
             for (var i = 0; i < length; i++) {
                 if (i === 0) {
                     startingPointsToString = '[' + startingPoints[i] + ']';
                     bezierPointsToString = '[ ' + bezierPoints[i] + ' ]';
                 }
                 else {
                     startingPointsToString += ', [ ' + startingPoints[i] + ']';
                     bezierPointsToString += ', [' + bezierPoints[i] + ']';
                 }
             }

             output = 'var startingPoints = [' + startingPointsToString + ']' + ', bezierPoints = [' + bezierPointsToString + '], length = ' + length + ';\n' + forLoop;
         }
         
         textArea.value = '';
         textArea.value = output;
     }

     find('#shorten-code').onchange = function () {
         shortenCode = this.checked;
         getAllCurves();
     };    
})();