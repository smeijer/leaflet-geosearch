// @ts-nocheck

export function validateCoords(query) {
    const q = query.trim();
    const regex = /^(-?[0-9]*\.?\s*[0-9]*)\s*,?\s*(-?[0-9]*\.?[0-9]*)$/g;
    const match = regex.exec(q);
    if (match) {
        var lat = Number(match[1]);
        var lng = Number(match[2]);
        if (( -90 < lat < 90) && ( -180 < lng < 180)) {
            return [{
                x: lng,
                y: lat,
                label: q,
                bounds: null,
                raw: {}
            }];
        }
    }
    return false;
}
