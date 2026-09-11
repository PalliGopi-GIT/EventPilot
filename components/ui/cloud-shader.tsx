"use client";

import React, { useEffect, useRef } from "react";

interface CloudShaderProps {
  className?: string;
}

export function CloudShader({ className = "" }: CloudShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      // Fallback to 2D context with simple gradient
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const animate = () => {
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Create animated gradient
        const time = Date.now() * 0.001;
        const gradient = ctx.createLinearGradient(0, 0, width, height);

        gradient.addColorStop(0, `hsla(220, 80%, ${10 + Math.sin(time) * 5}%, 0.8)`);
        gradient.addColorStop(0.5, `hsla(240, 60%, ${15 + Math.cos(time * 0.7) * 8}%, 0.6)`);
        gradient.addColorStop(1, `hsla(260, 70%, ${8 + Math.sin(time * 0.5) * 3}%, 0.9)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        requestAnimationFrame(animate);
      };

      const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      };

      window.addEventListener('resize', resize);
      resize();
      animate();

      return () => window.removeEventListener('resize', resize);
    }

    let animationFrameId: number;
    let startTime = Date.now();

    // Advanced WebGL shader implementation
    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 uResolution;
      uniform float uTime;
      varying vec2 vUv;

      // Noise functions for cloud generation
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 6; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / uResolution.xy;
        st.x *= uResolution.x / uResolution.y;

        // Animate the clouds
        vec2 q = vec2(0.0);
        q.x = fbm(st + 0.08 * uTime);
        q.y = fbm(st + vec2(1.0));

        vec2 r = vec2(0.0);
        r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.12 * uTime);
        r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.08 * uTime);

        float f = fbm(st + r);

        // Enhanced color palette for clouds
        vec3 colorA = vec3(0.05, 0.1, 0.2); // Deep blue
        vec3 colorB = vec3(0.1, 0.3, 0.6);  // Bright blue
        vec3 colorC = vec3(0.4, 0.6, 0.9);  // Light blue
        vec3 colorD = vec3(0.02, 0.05, 0.15); // Very dark blue

        vec3 col = mix(colorA, colorB, clamp((f * f) * 4.0, 0.0, 1.0));
        col = mix(col, colorC, clamp(length(q), 0.0, 1.0) * 0.6);
        col = mix(col, colorD, clamp(length(r.x), 0.0, 1.0) * 0.3);

        // Add some brightness variation
        col += 0.2 * vec3(f * f * f + 0.6 * f * f + 0.5 * f);

        // Subtle vignette
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        col *= clamp(pow(16.0 * vignette, 0.15), 0.2, 1.0);

        gl_FragColor = vec4(col, 0.85);
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program));
      return;
    }

    // Setup geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "uResolution");
    const timeUniformLocation = gl.getUniformLocation(program, "uTime");

    const resize = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }
    };

    const render = () => {
      resize();
      gl.useProgram(program);

      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      const elapsedSeconds = (Date.now() - startTime) / 1000.0;
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, elapsedSeconds);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}