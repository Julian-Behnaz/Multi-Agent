#version 300 es
 
// Uniforms
uniform mat3x2 u_projection;
//

// Attributes
in vec2 a_position;
in vec4 a_color;
in vec2 a_sdf;
//

// Varyings
out vec4 v_color;
out vec2 v_sdf;
//

void main() { 
  v_color = a_color;
  v_sdf = a_sdf;

  gl_Position = vec4(u_projection * vec3(a_position, 1), 0, 1);
}