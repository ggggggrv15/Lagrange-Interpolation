window.onload = function() {
    var canvas = document.getElementById("graphCanvas");
    var ctx = canvas.getContext("2d");

    var points = [];
    var isDragging = false;
    var dragIndex = -1;

    // Coordinate params
    var xmin = -10;
    var xmax = 10;
    var ymin = -10;
    var ymax = 10;

    var scaleX = canvas.width / (xmax - xmin);
    var scaleY = canvas.height / (ymax - ymin);

    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mousemove", mouseMove, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    canvas.addEventListener("click", mouseClick, false);
    canvas.addEventListener("contextmenu", rightClick, false);

    // Initial drawing
    draw();

    function mouseDown(e) {
        var mousePos = getMousePos(e);
        var x = mousePos.x;
        var y = mousePos.y;

        // Check if mouse is near an existing point
        for (var i = 0; i < points.length; i++) {
            var pt = points[i];
            var sx = mathToScreenX(pt.x);
            var sy = mathToScreenY(pt.y);
            var dx = x - sx;
            var dy = y - sy;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) {
                isDragging = true;
                dragIndex = i;
                break;
            }
        }
    }

    function mouseMove(e) {
        if (isDragging) {
            var mousePos = getMousePos(e);
            var x = mousePos.x;
            var y = mousePos.y;

            // Update point position
            var pt = points[dragIndex];
            pt.x = screenToMathX(x);
            pt.y = screenToMathY(y);

            // Prevent two points from having the same x-coordinate
            for (var i = 0; i < points.length; i++) {
                if (i !== dragIndex && Math.abs(pt.x - points[i].x) < 1e-6) {
                    pt.x += 1e-6; // Adjust x slightly
                }
            }

            draw();
        }
    }

    function mouseUp(e) {
        if (isDragging) {
            isDragging = false;
            dragIndex = -1;
            draw();
        }
    }

    function mouseClick(e) {
        // If not dragging, add a point
        if (!isDragging) {
            var mousePos = getMousePos(e);
            var x = mousePos.x;
            var y = mousePos.y;

            var pt = {
                x: screenToMathX(x),
                y: screenToMathY(y)
            };

            // Prevent new point from having the same x-coordinate as existing points
            for (var i = 0; i < points.length; i++) {
                if (Math.abs(pt.x - points[i].x) < 1e-5) {
                    pt.x += 1e-5;
                }
            }

            points.push(pt);

            draw();
        }
    }

    function rightClick(e) {
        e.preventDefault();
        var mousePos = getMousePos(e);
        var x = mousePos.x;
        var y = mousePos.y;

        // Check if mouse near an existing point
        for (var i = 0; i < points.length; i++) {
            var pt = points[i];
            var sx = mathToScreenX(pt.x);
            var sy = mathToScreenY(pt.y);
            var dx = x - sx;
            var dy = y - sy;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) {
                // Delete this point
                points.splice(i, 1);
                draw();
                break;
            }
        }
    }

    function getMousePos(evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function mathToScreenX(x) {
        return (x - xmin) * scaleX;
    }

    function mathToScreenY(y) {
        return canvas.height - (y - ymin) * scaleY;
    }

    function screenToMathX(x) {
        return x / scaleX + xmin;
    }

    function screenToMathY(y) {
        return (canvas.height - y) / scaleY + ymin;
    }

    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw axes
        drawAxes();

        // Draw points
        for (var i = 0; i < points.length; i++) {
            var pt = points[i];
            var sx = mathToScreenX(pt.x);
            var sy = mathToScreenY(pt.y);
            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
        }

        // Draw interpolating polynomial 
        // (not sure if we can technically interpolate on only one point, but this is the "engineering perspective," as you put it)
        if (points.length >= 1) {
            drawPolynomial();
        }
    }

    function drawAxes() {
        ctx.beginPath();
        ctx.strokeStyle = "#888";

        // X-axis
        if (ymin < 0 && ymax > 0) {
            var y0 = mathToScreenY(0);
            ctx.moveTo(0, y0);
            ctx.lineTo(canvas.width, y0);
        }

        // Y-axis
        if (xmin < 0 && xmax > 0) {
            var x0 = mathToScreenX(0);
            ctx.moveTo(x0, 0);
            ctx.lineTo(x0, canvas.height);
        }

        ctx.stroke();
    }

    function drawPolynomial() {
        var n = 1000; // Number of points to plot
        var xValues = [];
        var yValues = [];

        for (var i = 0; i <= n; i++) {
            var x = xmin + (xmax - xmin) * i / n;
            var y = lagrangePolynomial(x);
            xValues.push(x);
            yValues.push(y);
        }

        ctx.beginPath();
        ctx.strokeStyle = "blue";

        for (var i = 0; i <= n; i++) {
            var sx = mathToScreenX(xValues[i]);
            var sy = mathToScreenY(yValues[i]);

            if (i === 0) {
                ctx.moveTo(sx, sy);
            } else {
                ctx.lineTo(sx, sy);
            }
        }

        ctx.stroke();
    }

    function lagrangePolynomial(x) {
        var result = 0;
        var n = points.length;

        for (var i = 0; i < n; i++) {
            var term = points[i].y;
            for (var j = 0; j < n; j++) {
                if (j !== i) {
                    var denominator = points[i].x - points[j].x;
                    if (Math.abs(denominator) < 1e-6) {
                        continue; // Skip this term to avoid division by zero
                    }
                    term *= (x - points[j].x) / denominator;
                }
            }
            result += term;
        }
        return result;
    }
};
