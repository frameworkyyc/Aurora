/* Selected project locations: the single data source for the Services-page traverse
   and the Projects-page map. Only information already on the site is used.
   coord: 'recorded'  = latitude/longitude as already published on the site
          'regional'  = an approximate reference for the named town or region (not a project-site position)
   Fields left empty are unknown and are simply not shown. */
window.AURORA_PROJECTS = [
  {id:'vancouver', place:'Vancouver', stn:'AS-VAN', lat:49.28, lon:-123.12, coord:'recorded',
   loc:'Vancouver, BC · Victoria area', title:'Highway 1 McKenzie Upgrades', desc:'', img:'', href:'',
   elev:12, method:'Layout · machine control'},
  {id:'squamish', place:'Squamish', stn:'AS-SQM', lat:49.70, lon:-123.15, coord:'regional',
   loc:'Squamish, BC', title:'Woodfibre LNG', desc:'', img:'', href:''},
  {id:'port-alice', place:'Port Alice', stn:'AS-PTA', lat:50.42, lon:-127.45, coord:'recorded',
   loc:'Port Alice, BC', title:'Nucel pulp mill',
   desc:'Multiple LiDAR and sonar datasets were merged into one measured record of existing conditions at the mill closure.',
   img:'assets/card-nucel.jpg', href:'projects.html#proj-50', elev:8, method:'LiDAR · sonar merge'},
  {id:'prince-george', place:'Prince George', stn:'AS-PGE', lat:53.92, lon:-122.75, coord:'regional',
   loc:'Prince George, BC', title:'Municipal Well Site Reality Capture', desc:'Reality capture at a municipal well site.', img:'', href:''},
  {id:'prince-rupert', place:'Prince Rupert', stn:'AS-PRR', lat:54.31, lon:-130.32, coord:'regional',
   loc:'Prince Rupert, BC', title:'REEF / RIPET / Cedar LNG', names:['REEF','RIPET','Cedar LNG'], desc:'', img:'', href:'projects.html#proj-reef'},
  {id:'ksm', place:'Stewart', stn:'AS-STW', lat:56.52, lon:-130.35, coord:'recorded',
   loc:'KSM Mine, near Stewart, BC', title:'Layout and survey QA at KSM',
   desc:'Layout and survey quality assurance on a mining construction project, working with the construction team to identify root-cause issues.',
   img:'assets/card-ksm.jpg', href:'projects.html#proj-56', elev:1180, method:'Layout · monitoring'},
  {id:'nwt', place:'Fort Providence', stn:'AS-FPV', lat:61.35, lon:-117.68, coord:'regional',
   loc:'Fort Providence, NWT', title:'Deh Cho Bridge', desc:'', img:'', href:''},
  {id:'baffin', place:'Baffin Island', stn:'AS-BAF', lat:66.00, lon:-70.50, coord:'recorded',
   loc:'Baffin Island, Nunavut', title:'Bridge approach washout',
   desc:'A 30 km as-built survey became emergency construction coordination on site when a bridge approach washed out. The bridge held and the route stayed open through break-up.',
   img:'assets/card-baffin.jpg', href:'projects.html#proj-66', elev:212, method:'As-built · 30 km'}
];
