import "https://unpkg.com/chart.js@2.7.1/dist/Chart.bundle.min.js?module";
import "https://cdn.jsdelivr.net/npm/chartjs-plugin-colorschemes";

class PowerUsageCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('You need to define an entity');
    }
    const root = this.shadowRoot;
    if (root.lastChild) root.removeChild(root.lastChild);

    const card = document.createElement('ha-card');
    const content = document.createElement('div');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const style = document.createElement('style');

    card.id ='ha-card';
    content.id = 'content';
    canvas.id = 'cnv';
    content.style.height = '480px';
    canvas.height=480;
    card.appendChild(content);
    card.appendChild(style);
    content.appendChild(canvas);
    root.appendChild(card);
    this._config = config;
  }

  set hass(hass) {
    const root = this.shadowRoot;
    const config = this._config;
    const card = root.getElementById("ha-card");
    const content = root.getElementById("content");
    const canvas = root.getElementById("cnv");
    const ctx = canvas.getContext('2d');
    const hassEntities = config.entities.map(x => hass.states[x.entity]);
    var entityNames = config.entities.map(x => x.name !== undefined ? x.name : hass.states[x.entity]["attributes"]["friendly_name"] !== undefined ? hass.states[x.entity]["attributes"]["friendly_name"] : x.entity);
    var entityData = hassEntities.map(x => x.state);
    card.header = config.title ? config.title : 'Power usage graph';

    if (config.total_power_usage){
        const totalEntity =  hass.states[config.total_power_usage]
        const total = (totalEntity.attributes.unit_of_measurement == 'kW') ? totalEntity.state * 1000 : totalEntity.state;
        const measured = hassEntities.map(x => Number(x.state)).reduce(( accumulator, currentValue ) => accumulator + currentValue,  0);
        entityData.push(total - measured)
        entityNames.push(config.unknownText ? config.unknownText : 'Unknown');
    }

    const emptyIndexes = entityData.reduce((arr, e, i) => ((e == 0) && arr.push(i), arr), [])
    entityData = entityData.filter((element, index, array) => !emptyIndexes.includes(index));
    entityNames = entityNames.filter((element, index, array) => !emptyIndexes.includes(index));

    const doughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [{
            data: [],
            borderWidth: 1,
            borderColor:'#00c0ef',
            label: 'liveCount',
    }]
  },
       options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 0 },
            legend: {
                position: 'bottom',
                display: true
             },
            hover: { mode: 'index' },
            plugins: {colorschemes: { scheme: 'brewer.Paired12' } }
        }
    });

  var getData = function() {
    doughnutChart.data =  { datasets: [{ data: entityData }], labels: entityNames };
    doughnutChart.update();
  };
  getData();
  }

  getCardSize() {
    return 3;
  }
}

customElements.define('power-usage-card', PowerUsageCard);
