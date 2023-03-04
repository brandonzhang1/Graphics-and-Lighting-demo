#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec4 color;
layout(location = 2) in vec3 normals;

smooth out vec4 vertexColor;
smooth out vec3 lighting;

uniform mat4 boxtransform;
uniform mat4 conetransform;
uniform mat4 postransform;
uniform mat4 viewtransform;

void main() {
    vec4 pos = postransform*vec4(position, 1.0f);

    vec4 boxPoint = boxtransform*vec4(0, 0, 0, 1.0f);
    vec4 coneTipPoint = conetransform*vec4(0, 0, 0, 1.0f);
    vec4 coneBaseCenterPoint = conetransform*vec4(0, -1.4, 0, 1.0f);
    vec4 transNormal = normalize(postransform*vec4(normals, 0.0f));

    float boxSrcInt = 1.5;
    float coneSrcInt = 1.0;
    float LambientConst = 0.2;
    float RambientConst = 1.0;
    float LdiffuseConst = 0.2;
    float RdiffuseConst = 1.0;
    float LshineConst = 0.6;
    float RshineConst = 1.0;
    vec4 viewVec = normalize(vec4(0.0, 0.0, 10.0, 1.0) - pos);


    vec4 vec2Box = normalize(boxPoint - pos); //incoming vector
    float boxIncInt = boxSrcInt;
    float boxAmbientPart = LambientConst*boxIncInt;
    float boxDiffusePart = LdiffuseConst*dot(transNormal, vec2Box);
    vec4 boxReflectVec = normalize(2.0*dot(vec2Box, transNormal)*transNormal - vec2Box);
    float boxShineTerm = dot(viewVec, boxReflectVec);
    float boxShinePart = LshineConst*boxIncInt*pow(boxShineTerm, 8.0);
    float outBoxLight = RambientConst*boxAmbientPart + RdiffuseConst*boxDiffusePart + RshineConst*boxShinePart;
    

    vec4 vec2Cone = normalize(coneTipPoint - pos);
    vec4 coneDirection = normalize(coneTipPoint - coneBaseCenterPoint);
    float lightAngle = degrees(acos(length(dot(vec2Cone, coneDirection))/ (length(coneDirection)*length(vec2Cone))));
    float outConeLight = 0.0;
    if (lightAngle < 30.0) {
        float coneIncInt = cos(radians(lightAngle))*coneSrcInt;
        float coneAmbientPart = LambientConst*coneIncInt;
        float coneDiffusePart = LdiffuseConst*dot(transNormal, vec2Cone);
        vec4 coneReflectVec = normalize(2.0*dot(vec2Cone, transNormal)*transNormal - vec2Cone);
        float coneShineTerm = dot(viewVec, coneReflectVec);
        float coneShinePart = LshineConst*coneIncInt*pow(coneShineTerm, 8.0);
        outConeLight = RambientConst*coneAmbientPart + RdiffuseConst*coneDiffusePart + RshineConst*coneShinePart;
    }

    float finalBoxLight = outBoxLight + outConeLight;

    lighting = vec3(finalBoxLight, finalBoxLight, finalBoxLight);
    vertexColor = color;
    gl_Position = viewtransform*pos;
}