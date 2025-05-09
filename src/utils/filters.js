export function applyFilters(ctx, w, h) {
  const { data } = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < data.length; i+=4) {
    data[i] = Math.min(255, data[i]*1.2);
    data[i+1] = Math.min(255, data[i+1]*1.2);
    data[i+2] = Math.min(255, data[i+2]*1.2);
  }
  ctx.putImageData(new ImageData(data, w, h), 0, 0);
}
