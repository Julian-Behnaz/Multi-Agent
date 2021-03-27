#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// Varyings from vert
in vec4 v_color;
in vec2 v_sdf;
//

out vec4 outColor;
 
// https://www.iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm
float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r )
{
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}

void main() {
  
  // outColor = v_color;
  // outColor = vec4((v_sdf.xy+1.0)*0.5, 0, 1);
  // outColor = (length(v_sdf.xy) > 0.999? 0.0 : 1.0) * vec4(1) * v_color;
  // outColor = ((1.0 - max(d.x, d.y)) * vec4(1.0) + 0.3) * v_color;

  vec2 absSdf = abs(v_sdf);
  float distFromEdge = (1.0 - max(absSdf.x, absSdf.y));
  float gradientLength = length(vec2(dFdx(distFromEdge), dFdy(distFromEdge)));
  float thresholdWidth = 1.6 * gradientLength;
  // float thresholdWidth = 1.9;//1.0 * gradientLength;
  float antialiased = clamp(distFromEdge/thresholdWidth + 0.5, 0.0, 1.0);
  outColor = v_color * antialiased;

  // Circle
  // outColor = sdRoundedBox((v_sdf.xy), vec2(1.0), vec4(1.0)) < 0.0? v_color : vec4(0.0);
  // Rounded rect
  // outColor = sdRoundedBox((v_sdf.xy), vec2(1.0), vec4(0.2)) < 0.0? v_color : vec4(0.0);
}