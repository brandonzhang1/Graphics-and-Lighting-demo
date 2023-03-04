#version 300 es

in mediump vec4 vertexColor;
in mediump vec3 lighting;

out mediump vec4 outputColor;

void main() {
    outputColor = vec4(vec3(vertexColor)*lighting, 1.0);
}