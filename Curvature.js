 /***********************************
    Curvature! - A tool lets you draw curves using Canvas 2d APIs!
    Developed by Muaz Khan - http://twitter.com/muazkh
***********************************/
(function() {
    /* Global Variables */
    var 
    win = window, 
    doc = win.document, 

    /* is touch compatible device? */
    isTouch = 'createTouch' in doc, 

    /* Find element (s) using query selector */
    find = function(selector) {
        return doc.querySelector(selector);
    }, 

    /* Designer Context is the main context that allows dragging the curves! */
    designerContext = find('#designer-canvas').getContext('2d'), 

    /* Backward canvas stores previous curves! */
    backwardContext = find('#backward-canvas').getContext('2d'), 

    /* An element to display "moveTo" coordinates: context.moveTo(x, y) */
    elementForMoveTo = find('#move-to'), 

    /* An element to display bezierCurve coordinates: context.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y)  */
    elementForCurveTo = find('#curve-to'), 

    /* Used for circles: "first-circle", "second-circle", "third-circle" and "fourth-circle" */
    shapeOnMouseDown = null, 

    /* The object stores the coordinates for all drawing: circles and curves */
    points = {
        /* The "first-circle": used for controlling "moveTo" coordinates of the curve */
        circleForMoveToCurveX: 200,
        circleForMoveToCurveY: 300,

        /* The "second-circle": used for controlling "first control point" coordinates of the curve */
        circleForFirstControlPointX: 300,
        circleForFirstControlPointY: 100,

        /* The "third-circle": used for controlling "second control point" coordinates of the curve */
        circleForSecondControlPointX: 600,
        circleForSecondControlPointY: 100,

        /* The "fourth-circle": used for controlling "ending point" coordinates of the curve */
        circleForEndingPointX: 700,
        circleForEndingPointY: 300,

        /* --------- Curves related --------- */

        /* "moveTo": bezier curve */
        moveToX: 190,
        moveToY: 300,

        /* These are moveTo points; while started designing. All upcoming points will be subtracted from these points! – to allow shape movement easy! */
        topmostMoveToX: 190,
        topmostMoveToY: 300,
        
        firstControlPointX: 350,
        firstControlPointY: 150,
        secondControlPointX: 550,
        secondControlPointY: 150,
        endingPointX: 690,
        endingPointY: 300
    }, 

    /* absolute or relative coordinates */
    isAbsolute = false, 
    isRelative = true, 

    /* menu buttons */
    btnAbsolute = find('#absolute'), 
    btnRelative = find('#relative'), 
    btnNewCurve = find('#new-curve'), 
    btnGetAllCurves = find('#get-all-curves'), 
    btnOptions = find('#options'), 
    btnHelp = find('#help'), 

    /* Arrays for storing absolute/relative coordinates */
    relativeCurvesPoints = [], 
    relativeMoveToPoints = [], 
    absoluteCurvesPoints = [], 
    absoluteMoveToPoints = [], 
    
    isOnlyOneMoveToPoint = false, 
    isNoClearRect = false, 

    /* While creating new curves: swap previous moveTo x-y coordinates and endingPoints coordinates; - helpful when designing complex shapes! */
    isReplaceMoveToPointsWithEndingPoints = false, 

    /* If checked, calling context.fill() too */
    isfillColor = false, 

    /* Get real time results in text area while drawing! */
    isGetRealtimeResults = false, 
    
    textArea = find('#text-area');

    /* ---------- Events Handlers ---------- */

    /* Document-Level events */
    designerContext.canvas.addEventListener(isTouch ? 'touchstart' : 'mousedown', mouseDown, false);
    designerContext.canvas.addEventListener(isTouch ? 'touchend' : 'mouseup', mouseUp, false);
    designerContext.canvas.addEventListener(isTouch ? 'touchmove' : 'mousemove', mouseMove, false);
    doc.addEventListener('keyup', keyUp, false);

    /* Button-Level events */
    btnAbsolute.addEventListener(isTouch ? 'touchstart' : 'click', btnAbsoluteClick, false);
    btnRelative.addEventListener(isTouch ? 'touchstart' : 'click', btnRelativeClick, false);
    btnNewCurve.addEventListener(isTouch ? 'touchstart' : 'click', newCurve, false);
    btnGetAllCurves.addEventListener(isTouch ? 'touchstart' : 'click', getAllCurves, false);
    btnOptions.addEventListener(isTouch ? 'touchstart' : 'click', btnOptionsClick, false);
    btnHelp.addEventListener(isTouch ? 'touchstart' : 'click', btnHelpClick, false);

    /* Setting width/height for both canvas */
    designerContext.canvas.width = backwardContext.canvas.width = innerWidth;
    designerContext.canvas.height = backwardContext.canvas.height = innerHeight - designerContext.canvas.offsetTop;

    /* Setting width/height for textarea */
    textArea.style.width = (innerWidth - 40) + 'px';
    textArea.style.height = (innerHeight / 4) + 'px';

    /* Default properties for designer canvas! */
    designerContext.strokeStyle = 'yellow';
    designerContext.font = '20px Verdana, Arial';
    designerContext.lineWidth = 2;

    /* Handle Drawing: the main function which handles all drawing! */
    function handleDrawing(pageX, pageY, context) {
        context.clearRect(0, 0, 50000, 50000);

        /* If mouse is down over first circle: first circle is used for "move-to" coordinates of the curve. */
        context.beginPath();
        if (shapeOnMouseDown === 'first-circle') {
            points.circleForMoveToCurveX = points.moveToX = pageX;
            points.circleForMoveToCurveY = points.moveToY = pageY;
            
            context.fillStyle = 'white';
            context.fillText('moveTo (' + (pageX - 10) + ', ' + pageY + ')', pageX + 10, pageY + 10);
            
            points.moveToX -= 10;
            context.fillStyle = 'rgba(255, 255, 0, .8)';
        } 
        else
            context.fillStyle = 'black';

        /* Drawing the first "arc" */
        context.moveTo(points.circleForMoveToCurveX, points.circleForMoveToCurveY);
        context.arc(points.circleForMoveToCurveX - 10, points.circleForMoveToCurveY, 10, 0, Math.PI * 2, false);
        context.closePath();
        context.fill();
        context.stroke();

        /* If mouse is down over second circle: second circle is used for "first control points" of the curve. */
        context.beginPath();
        if (shapeOnMouseDown === 'second-circle') {
            context.fillStyle = 'white';
            context.fillText('1st control point (' + pageX + ', ' + pageY + ')', pageX + 10, pageY + 10);
            points.circleForFirstControlPointX = points.firstControlPointX = pageX;
            points.circleForFirstControlPointY = points.firstControlPointY = pageY;
            context.fillStyle = 'rgba(255, 255, 0, .8)';
        } 
        else
            context.fillStyle = 'black';
        /* Drawing the second "arc" */
        context.moveTo(points.circleForFirstControlPointX, points.circleForFirstControlPointY);
        context.arc(points.circleForFirstControlPointX - 10, points.circleForFirstControlPointY, 10, 0, Math.PI * 2, false);
        context.closePath();
        context.fill();
        context.stroke();

        /* If mouse is down over third circle: third circle is used for "second control points" of the curve. */
        context.beginPath();
        if (shapeOnMouseDown === 'third-circle') {
            context.fillStyle = 'white';
            context.fillText('2nd control point (' + pageX + ', ' + pageY + ')', pageX + 10, pageY + 10);
            points.circleForSecondControlPointX = points.secondControlPointX = pageX;
            points.circleForSecondControlPointY = points.secondControlPointY = pageY;
            context.fillStyle = 'rgba(255, 255, 0, .8)';
        } 
        else
            context.fillStyle = 'black';

        /* Drawing the third "arc" */
        context.moveTo(points.circleForSecondControlPointX, points.circleForSecondControlPointY);
        context.arc(points.circleForSecondControlPointX - 10, points.circleForSecondControlPointY, 10, 0, Math.PI * 2, false);
        context.closePath();
        context.fill();
        context.stroke();

        /* If mouse is down over fourth circle: fourth circle is used for "ending points" of the curve. */
        context.beginPath();
        if (shapeOnMouseDown === 'fourth-circle') {
            context.fillStyle = 'white';
            context.fillText('Ending point (' + (pageX - 10) + ', ' + pageY + ')', pageX + 10, pageY + 10);
            points.circleForEndingPointX = points.endingPointX = pageX;
            points.circleForEndingPointY = points.endingPointY = pageY;
            points.endingPointX -= 10;
            context.fillStyle = 'rgba(255, 255, 0, .8)';
        } 
        else
            context.fillStyle = 'black';

        /* Drawing the fourth "arc" */
        context.moveTo(points.circleForEndingPointX, points.circleForEndingPointY);
        context.arc(points.circleForEndingPointX - 10, points.circleForEndingPointY, 10, 0, Math.PI * 2, false);
        context.closePath();
        context.fill();
        context.stroke();

        /* Drawing the Bezier curve! */
        context.beginPath();
        
        context.moveTo(points.moveToX, points.moveToY);
        context.bezierCurveTo(points.firstControlPointX, points.firstControlPointY, points.secondControlPointX, points.secondControlPointY, points.endingPointX, points.endingPointY);

        /* fillStyle will be used when "isFillColor" === true! */
        if (isfillColor) {
            designerContext.fillStyle = 'rgba(255, 255, 0, .8)';
            designerContext.fill();
        }
        
        context.stroke();

        /*  The term "relative points" is used for points that are extracted from x and y values so that end-user can easily move the drawn object "as whole"! - See demo: http://bit.ly/curvature-relative-coordinates */
        
        var moveToX = points.topmostMoveToX, 
        moveToY = points.topmostMoveToY, 
        firstControlPointX, 
        firstControlPointY, 
        secondControlPointX, 
        secondControlPointY, 
        endingPointX, 
        endingPointY;

        /* Relative coordinates for first-control-point-X */
        if (points.firstControlPointX > moveToX)
            firstControlPointX = 'x + ' + (points.firstControlPointX - moveToX);
        else if (points.firstControlPointX < moveToX)
            firstControlPointX = 'x - ' + (moveToX - points.firstControlPointX);
        else
            firstControlPointX = 'x';

        /* Relative coordinates for first-control-point-Y */
        if (points.firstControlPointY > moveToY)
            firstControlPointY = 'y + ' + (points.firstControlPointY - moveToY);
        else if (points.firstControlPointY < moveToY)
            firstControlPointY = 'y - ' + (moveToY - points.firstControlPointY);
        else
            firstControlPointY = 'y';

        /* Relative coordinates for second-control-point-X */
        if (points.secondControlPointX > moveToX)
            secondControlPointX = 'x + ' + (points.secondControlPointX - moveToX);
        else if (points.secondControlPointX < moveToX)
            secondControlPointX = 'x - ' + (moveToX - points.secondControlPointX);
        else
            secondControlPointY = 'x';

        /* Relative coordinates for second-control-point-Y */
        if (points.secondControlPointY > moveToY)
            secondControlPointY = 'y + ' + (points.secondControlPointY - moveToY);
        else if (points.secondControlPointY < moveToY)
            secondControlPointY = 'y - ' + (moveToY - points.secondControlPointY);
        else
            secondControlPointY = 'y';

        /* Relative coordinates for ending-point-X */
        if (points.endingPointX > moveToX)
            endingPointX = 'x + ' + (points.endingPointX - moveToX);
        else if (points.endingPointX < moveToX)
            endingPointX = 'x - ' + (moveToX - points.endingPointX);
        else
            endingPointX = 'x';

        /* Relative coordinates for ending-point-Y */
        if (points.endingPointY > moveToY)
            endingPointY = 'y + ' + (points.endingPointY - moveToY);
        else if (points.endingPointY < moveToY)
            endingPointY = 'y - ' + (moveToY - points.endingPointY);
        else
            endingPointY = 'y';

        /* Outputting all extracted coordinates! */
        var tempHTMLForMoveTo = 0;
        if (relativeMoveToPoints.length === 0)
            tempHTMLForMoveTo = 'context.moveTo( x = ' + points.moveToX + ', y = ' + points.moveToY + ' );';
        else {
            /* The original myth of "relative coordinating system" goes here! */
            var tempX, tempY;
            
            if (points.moveToX < points.topmostMoveToX)
                tempX = 'context.moveTo( x - ' + (points.topmostMoveToX - points.moveToX);
            else if (points.moveToX > points.topmostMoveToX)
                tempX = 'context.moveTo( x + ' + (points.moveToX - points.topmostMoveToX);
            else
                tempX = 'context.moveTo( x ';
            
            if (points.moveToY < points.topmostMoveToY)
                tempY = ', y - ' + (points.topmostMoveToY - points.moveToY);
            else if (points.moveToY > points.topmostMoveToY)
                tempY = ', y + ' + (points.moveToY - points.topmostMoveToY);
            else
                tempY = ', y ';
            
            tempHTMLForMoveTo = tempX + tempY + ' );';
        }
        
        var tempHTMLForCurve = 'context.bezierCurveTo( ' + firstControlPointX + ', ' 
        + firstControlPointY + ', ' 
        + secondControlPointX + ', ' 
        + secondControlPointY + ', ' 
        + endingPointX + ', ' 
        + endingPointY + ' );';
        
        if (isRelative) {
            elementForCurveTo.innerHTML = tempHTMLForCurve;
            elementForMoveTo.innerHTML = tempHTMLForMoveTo;
        } 
        else {
            /* If "isAbsolute" checkbox is checked or "Absolute" button is clicked then storing relative coordinates in two hidden fields so we can access them later to store the relative coordinates when calling "New Curve". */
            find('#hidden-curve-to').value = tempHTMLForCurve;
            find('#hidden-move-to').value = tempHTMLForMoveTo;
        }


        /* The "end-user" wants "absolute points":----  e.pageX and e.pageY */
        if (isAbsolute) {
            /* Outputting all coordinates! */
            elementForMoveTo.innerHTML = 'context.moveTo( ' + points.moveToX + ', ' + points.moveToY + ' );';
            elementForCurveTo.innerHTML = 'context.bezierCurveTo( ' + points.firstControlPointX + ', ' 
            + points.firstControlPointY + ', ' 
            + points.secondControlPointX + ', ' 
            + points.secondControlPointY + ', ' 
            + points.endingPointX + ', ' 
            + points.endingPointY + ' );';
        }

        /* If end user says "not call clearRect method"! */
        if (isNoClearRect) {
            backwardContext.lineWidth = 2;
            backwardContext.strokeStyle = 'yellow';
            backwardContext.beginPath();
            backwardContext.moveTo(points.moveToX, points.moveToY);
            backwardContext.bezierCurveTo(points.firstControlPointX, points.firstControlPointY, points.secondControlPointX, points.secondControlPointY, points.endingPointX, points.endingPointY);
            backwardContext.stroke();

            /* Setting the relative coordinates! */
            if (isRelative) {
                relativeCurvesPoints[relativeCurvesPoints.length] = elementForCurveTo.innerHTML;
                relativeMoveToPoints[relativeMoveToPoints.length] = elementForMoveTo.innerHTML;
            } 
            else {
                /* If "isAbsolute" checkbox is checked or "Absolute" button is clicked then storing relative coordinates in two hidden fields so we can access them later to store the relative coordinates when calling "New Curve". */
                relativeMoveToPoints[relativeMoveToPoints.length] = find('#hidden-move-to').value;
                relativeCurvesPoints[relativeCurvesPoints.length] = find('#hidden-curve-to').value;
            }

            /* Setting the absolute coordinates! */
            absoluteMoveToPoints[absoluteMoveToPoints.length] = [points.moveToX, points.moveToY];
            absoluteCurvesPoints[absoluteCurvesPoints.length] = [points.firstControlPointX, points.firstControlPointY, points.secondControlPointX, points.secondControlPointY, points.endingPointX, points.endingPointY];
        }
        
        if (isGetRealtimeResults)
            getAllCurves();

        /* Setting first-most x-y coordinates – so all subsequent coordinates can be extracted from them! */
        if (relativeMoveToPoints.length === 0) {
            points.topmostMoveToX = points.moveToX;
            points.topmostMoveToY = points.moveToY;
        }
        /* The "Handle Drawing" function ends here */
    }

    /* Firing mouse-up event – so to stop dragging the curve! */
    function mouseUp(e) {
        e.preventDefault();
        e = e.pageX ? e : e.touches.length ? e.touches[0] : {pageX: 0,pageY: 0};
        
        var pageX = e.pageX - designerContext.canvas.offsetLeft, 
            pageY = e.pageY - designerContext.canvas.offsetTop;

        shapeOnMouseDown = null;
        handleDrawing(pageX, pageY, designerContext);
    }

    /* Firing mouse-move event – if mouse-down: dragging the curve’s appropriate point! */
    function mouseMove(e) {
        e.preventDefault();
        e = e.pageX ? e : e.touches.length ? e.touches[0] : {pageX: 0,pageY: 0};

        var pageX = e.pageX - designerContext.canvas.offsetLeft,
        pageY = e.pageY - designerContext.canvas.offsetTop;

        if (!!shapeOnMouseDown)
            handleDrawing(pageX, pageY, designerContext);
    }

    /* Firing mouse-down event – so to start dragging the curve! */
    function mouseDown(e) {
        e.preventDefault();
        e = e.pageX ? e : e.touches.length ? e.touches[0] : {pageX: 0,pageY: 0};

        /* Handle on which shape mouse is currently down so we can change coordinates and points accordingly! */
        var pageX = e.pageX - designerContext.canvas.offsetLeft, 
        pageY = e.pageY - designerContext.canvas.offsetTop;

        /* The expected coordinates for "first circle"! */
        if (pageX > points.circleForMoveToCurveX - 20 && pageX < points.circleForMoveToCurveX && pageY > points.circleForMoveToCurveY - 10 && pageY < points.circleForMoveToCurveY + 10) {
            shapeOnMouseDown = 'first-circle';
        }

        /* The expected coordinates for "second circle"! */
        if (pageX > points.circleForFirstControlPointX - 20 && pageX < points.circleForFirstControlPointX && pageY > points.circleForFirstControlPointY - 10 && pageY < points.circleForFirstControlPointY + 10) {
            shapeOnMouseDown = 'second-circle';
        }

        /* The expected coordinates for "third circle"! */
        if (pageX > points.circleForSecondControlPointX - 20 && pageX < points.circleForSecondControlPointX && pageY > points.circleForSecondControlPointY - 10 && pageY < points.circleForSecondControlPointY + 10) {
            shapeOnMouseDown = 'third-circle';
        }

        /* The expected coordinates for "fourth circle"! */
        if (pageX > points.circleForEndingPointX - 20 && pageX < points.circleForEndingPointX && pageY > points.circleForEndingPointY - 10 && pageY < points.circleForEndingPointY + 10) {
            shapeOnMouseDown = 'fourth-circle';
        }
        /* Mouse-down event ends here */
    }

    /* Handling key-up event */
    function keyUp(e) {
        e.preventDefault();

        if (e.keyCode === 27) {
            // "ESC" key for closing some sections
            textArea.value = '';
            textArea.parentNode.style.display = 'none';
            
            find('#options-container').style.display = 'none';
            find('#code-container').style.display = 'block';
            find('#help-section').style.display = 'none';
        } 
        else if (e.keyCode === 78) {
            // "N" key for creating new curve
            newCurve();
        } 
        else if (e.keyCode === 85) {
            // "U" key for Undo           
            if (absoluteCurvesPoints.length && absoluteMoveToPoints.length) {
                var lastMoveToPoint = absoluteMoveToPoints[absoluteMoveToPoints.length - 1], 
                lastCurvePoint = absoluteCurvesPoints[absoluteCurvesPoints.length - 1];
                
                points.circleForMoveToCurveX = points.moveToX = lastMoveToPoint[0];
                points.circleForMoveToCurveY = points.moveToY = lastMoveToPoint[1];
                
                points.firstControlPointX = points.circleForFirstControlPointX = lastCurvePoint[0];
                points.firstControlPointY = points.circleForFirstControlPointY = lastCurvePoint[1];
                points.secondControlPointX = points.circleForSecondControlPointX = lastCurvePoint[2];
                points.secondControlPointY = points.circleForSecondControlPointY = lastCurvePoint[3];
                points.endingPointX = points.circleForEndingPointX = lastCurvePoint[4];
                points.endingPointY = points.circleForEndingPointY = lastCurvePoint[5];
                
                
                absoluteMoveToPoints = absoluteMoveToPoints.reverse().splice(1).reverse();
                relativeMoveToPoints = relativeMoveToPoints.reverse().splice(1).reverse();
                
                absoluteCurvesPoints = absoluteCurvesPoints.reverse().splice(1).reverse();
                relativeCurvesPoints = relativeCurvesPoints.reverse().splice(1).reverse();
                
                handleDrawing(0, 0, designerContext);

                /* We have to change Backward Canvas too for the sake of clear undo effect! */
                backwardContext.clearRect(0, 0, 50000, 50000);
                backwardContext.beginPath();
                var length = absoluteCurvesPoints.length;
                for (var i = 0; i < length; i++) {
                    backwardContext.moveTo(absoluteMoveToPoints[i][0], absoluteMoveToPoints[i][1]);
                    var c = absoluteCurvesPoints[i];
                    backwardContext.bezierCurveTo(c[0], c[1], c[2], c[3], c[4], c[5]);
                }
                backwardContext.stroke();
            }
        }
    }

    /* Getting all coordinates for all curves! – It is most useful part of Curvature! */
    function getAllCurves() {
        var innerHTML = '';
        
        if (isRelative) {

            if (isOnlyOneMoveToPoint) {
                if (relativeMoveToPoints.length)
                    innerHTML += relativeMoveToPoints[0] + '\n';
                else
                    innerHTML += elementForMoveTo.innerHTML + '\n';
            }

            /* Getting all drawn curves and displaying them in the <textarea>! */
            if (relativeCurvesPoints.length) {
                var length = relativeCurvesPoints.length;
                for (var i = 0; i < length; i++) {
                    if (!isOnlyOneMoveToPoint) {
                        innerHTML += relativeMoveToPoints[i] + '\n';
                        innerHTML += relativeCurvesPoints[i] + '\n\n';
                    } 
                    else
                        innerHTML += relativeCurvesPoints[i] + '\n';
                
                }
            }
        }
        
        if (isAbsolute) {
            innerHTML = '';
            
            if (isOnlyOneMoveToPoint) {
                if (absoluteMoveToPoints.length)
                    innerHTML += 'context.moveTo( ' + absoluteMoveToPoints[0][0] + ', ' + absoluteMoveToPoints[0][1] + ' );\n';
                else
                    innerHTML += elementForMoveTo.innerHTML + '\n';
            }
            
            length = absoluteCurvesPoints.length;
            for (i = 0; i < length; i++) {
                var curve = absoluteCurvesPoints[i], moveTo = absoluteMoveToPoints[i];
                if (!isOnlyOneMoveToPoint) {
                    innerHTML += 'context.moveTo( ' + moveTo[0] + ', ' + moveTo[1] + ' );\n';
                    innerHTML += 'context.bezierCurveTo( ' + curve[0] + ', ' + curve[1] + ', ' + curve[2] + ', ' + curve[3] + ', ' + curve[4] + ', ' + curve[5] + ' );\n\n';
                } 
                else
                    innerHTML += 'context.bezierCurveTo( ' + curve[0] + ', ' + curve[1] + ', ' + curve[2] + ', ' + curve[3] + ', ' + curve[4] + ', ' + curve[5] + ' );\n';
            }
        }

        /* Also including current curve */
        if (!isOnlyOneMoveToPoint) {
            innerHTML += elementForMoveTo.innerHTML + '\n';
        }
        innerHTML += elementForCurveTo.innerHTML;
        
        /* Setting the value for <textarea>! */
        textArea.value = innerHTML;

        /* Displaying <textarea> and hiding all other section; if they are visible! */
        textArea.parentNode.style.display = 'block';
        find('#code-container').style.display = 'none';
        find('#options-container').style.display = 'none';
        find('#help-section').style.display = 'none';
        
        /* focusing <textara>! */
        textArea.focus();

        /* get-All-Curves function ends here */
    }

    /* Creating new curve! */
    function newCurve() {
        backwardContext.strokeStyle = 'yellow';
        backwardContext.lineWidth = 2;

        /* Drawing "current curve" into backward canvas */
        backwardContext.beginPath();
        backwardContext.moveTo(points.moveToX, points.moveToY);
        backwardContext.bezierCurveTo(points.firstControlPointX, points.firstControlPointY, 
        points.secondControlPointX, points.secondControlPointY, 
        points.endingPointX, points.endingPointY);

        /* fillStyle will be used when "isFillColor" === true! */
        if (isfillColor) {
            backwardContext.fillStyle = 'rgba(255, 255, 0, .8)';
            backwardContext.fill();
        }
        
        backwardContext.stroke();

        /* Also storing this curve into an array to later use! */
        if (isRelative) {
            relativeCurvesPoints[relativeCurvesPoints.length] = elementForCurveTo.innerHTML;
            relativeMoveToPoints[relativeMoveToPoints.length] = elementForMoveTo.innerHTML;
        } 
        else {
            /* If "isAbsolute" checkbox is checked or "Absolute" button is clicked then storing relative coordinates in two hidden fields so we can access them later to store the relative coordinates when calling "New Curve". */
            relativeMoveToPoints[relativeMoveToPoints.length] = find('#hidden-move-to').value;
            relativeCurvesPoints[relativeCurvesPoints.length] = find('#hidden-curve-to').value;
        }
        
        absoluteMoveToPoints[absoluteMoveToPoints.length] = [points.moveToX, points.moveToY];
        absoluteCurvesPoints[absoluteCurvesPoints.length] = [points.firstControlPointX, points.firstControlPointY, points.secondControlPointX, points.secondControlPointY, points.endingPointX, points.endingPointY];
        
        
        if (isReplaceMoveToPointsWithEndingPoints) {
            var tempX = points.moveToX, 
            tempY = points.moveToY, 
            tempCircleX = points.circleForMoveToCurveX, 
            tempCircleY = points.circleForMoveToCurveY;
            
            points.moveToX = points.endingPointX;
            points.moveToY = points.endingPointY;
            points.endingPointX = tempX;
            points.endingPointY = tempY;
            
            points.circleForMoveToCurveX = points.circleForEndingPointX;
            points.circleForMoveToCurveY = points.circleForEndingPointY;
            points.circleForEndingPointX = tempCircleX;
            points.circleForEndingPointY = tempCircleY;
        }
        if (isGetRealtimeResults)
            getAllCurves();
    }

    /* Button to get relatively positioned coordinates for only-one curve! */
    function btnRelativeClick(e) {
        isAbsolute = false;
        isRelative = true;
        handleDrawing(e.pageX, e.pageY, designerContext);
        find('#code-container').style.display = 'block';
        find('#options-container').style.display = 'none';
        find('#text-area').parentNode.style.display = 'none';
        find('#help-section').style.display = 'none';
        
        find('#is-absolute-points').checked = false;
    }

    /* Button to get absolutely positioned coordinates for only-one curve! */
    function btnAbsoluteClick(e) {
        isRelative = false;
        isAbsolute = true;
        handleDrawing(e.pageX, e.pageY, designerContext);
        find('#code-container').style.display = 'block';
        find('#options-container').style.display = 'none';
        find('#text-area').parentNode.style.display = 'none';
        find('#help-section').style.display = 'none';
        
        find('#is-absolute-points').checked = true;
    }

    /* "is-only-one-moveTo-point" check box --- top of <textarea> */
    find('#is-only-one-moveTo-point').onchange = function() {
        if (this.checked)
            isOnlyOneMoveToPoint = true;
        else
            isOnlyOneMoveToPoint = false;
        
        find('#text-area').innerHTML = '';
        getAllCurves();
    };

    /* options menu button click */
    function btnOptionsClick() {
        var optionsContainer = find('#options-container'), codeContainer = find('#code-container');
        
        optionsContainer.style.display = 'block';
        codeContainer.style.display = 'none';
        
        find('#text-area').parentNode.style.display = 'none';
        find('#help-section').style.display = 'none';
    }

    /* Help menu button click */
    function btnHelpClick() {
        find('#help-section').style.display = 'block';
        find('#options-container').style.display = 'none';
        find('#code-container').style.display = 'none';
        find('#text-area').parentNode.style.display = 'none';
    }

    /* Don't call clearRect; if this check is checked. */
    find('#do-not-clear-rect').onchange = function() {
        if (this.checked)
            isNoClearRect = true;
        else
            isNoClearRect = false;
    };

    /* Replace moveTo point with ending point on new curves - It is the most useful when drawing complex shapes! */
    find('#replace-moveTo-points').onchange = function() {
        if (this.checked)
            isReplaceMoveToPointsWithEndingPoints = true;
        else
            isReplaceMoveToPointsWithEndingPoints = false;
    };

    /* If checked, call context.fill() on main canvas */
    find('#is-fill-color').onchange = function() {
        if (this.checked)
            isfillColor = true;
        else
            isfillColor = false;
    };

    /* Get real time results in text area while drawing! */
    find('#get-real-time-results').onchange = function() {
        if (this.checked)
            isGetRealtimeResults = true;
        else
            isGetRealtimeResults = false;
    };

    /* If end user is interested in absolute coordinates; he can check a checkbox! */
    find('#is-absolute-points').onchange = function() {
        if (this.checked) {
            isRelative = false;
            isAbsolute = true;
        } 
        else {
            isRelative = true;
            isAbsolute = false;
        }

        /* Calling these two methods to change all coordinates from relative to absolute! */
        handleDrawing(0, 0, designerContext);
        getAllCurves();
    };

    /* On page-load: calling the drawing function using default values! */
    handleDrawing(0, 0, designerContext);
})();