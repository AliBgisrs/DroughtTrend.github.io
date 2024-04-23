Map.centerObject(table);
Map.addLayer(table);

// vegetation condition index (VCI)

var veg = ee.ImageCollection('MODIS/006/MOD13A1')
.filterBounds(table)
.filterDate('2010-01-01','2019-07-20')
.map(function(img){
  var band = img.select('NDVI').multiply(0.0001);
  var clip = band.clip(table);
  return clip
  .copyProperties(img,['system:time_start','system:time_end']);
});

print(veg)

// VCI = (ndvi - min)/(max - min)

var vci = veg.map(function(img){
  
  var min = img.reduceRegion(ee.Reducer.min(),table,500).get('NDVI');
  var max = img.reduceRegion(ee.Reducer.max(),table,500).get('NDVI');
  
  var index =  img.expression('(ndvi-min)/(max-min)',{
    'ndvi': img,
    'min': ee.Number(min),
    'max': ee.Number(max)
  });
  
  return index
  .copyProperties(img,['system:time_start','system:time_end']);});

print('vci images:',vci);

print(ui.Chart.image.series(
  vci, geometry, ee.Reducer.mean(), 500, 'system:time_start')
  .setOptions({
    title: 'Vegetation Condition Index Trend',
    vAxis: {title: 'Vegetation Moisture Values'},
    hAxis: {title: 'time'},
    trendlines: {0 : {color: 'red'}}
  }));

var regions = ee.FeatureCollection([
  ee.Feature(ee.Geometry(geometry),{label: 'point1'}),
  ee.Feature(ee.Geometry(geometry2),{label: 'point2'}),
  ee.Feature(ee.Geometry(geometry3),{label: 'point3'})
  ]);
  
print(ui.Chart.image.seriesByRegion(
  vci, regions, ee.Reducer.mean(), 'NDVI', 500, 'system:time_start', 'label'))
  

// thermal condition index (TCI)

var lst = ee.ImageCollection('MODIS/006/MOD11A2')
.filterBounds(table)
.filterDate('2019-01-01','2019-01-10')
.map(function(img){
  var band = img.select('LST_Day_1km').multiply(0.02);
  var clip = band.clip(table);
  var unmask = clip.gt(-999).reduceRegion(ee.Reducer.count(),table, 500);
  return clip
  .set('count',unmask.get('LST_Day_1km'))
  .copyProperties(img,['system:time_start','system:time_end']);
})
.filter(ee.Filter.neq('count',0));

print(lst);


// TCI =(max-lst)/(max-min)

var tci = lst.map(function(img){
  
  var min = img.reduceRegion(ee.Reducer.min(),table,1000).get('LST_Day_1km');
  var max = img.reduceRegion(ee.Reducer.max(),table,1000).get('LST_Day_1km');
  
  var index = img.expression('(max-lst)/(max-min)',{
    
    'lst': img,
    'min': ee.Number(min),
    'max': ee.Number(max)});
    
    return index
    .copyProperties(img,['system:time_start','system:time_end'])
});

print('TCI images:',tci);


print(ui.Chart.image.seriesByRegion(tci, regions, ee.Reducer.mean())
.setOptions({
  title: 'TCI',
  trendlines: {0 : { color: 'red'}}
}));




  

