import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const colors = {
  primary: '#0d2e56',
  secondary: '#1791c7',
  positive: '#35ce8d',
  negative: '#ff8811',
  background: '#fbf5f3',
  text: '#fbf5f3',
  neutral: '#e2e8f0',
  dark: '#2d3748',
  darker: '#1a202c',
};

const defaultInputs = {
  fleetSize: 20,
  idleTime: 8,
  fuelPrice: 3.50,
  apuInstallationCost: 10000,
  apuMaintenanceCost: 500,
  apuUsefulLife: 5,
  operatingDaysPerYear: 300,
};

function App() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);
  const chart3Ref = useRef(null);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  const chart1Instance = useRef(null);
  const chart2Instance = useRef(null);
  const chart3Instance = useRef(null);

  const [leftPanelHeight, setLeftPanelHeight] = useState('auto');

  useEffect(() => {
    const newResults = calculateSavings(inputs);
    setResults(newResults);
  }, [inputs]);

  useEffect(() => {
    // Moved the chart update functions inside the useEffect hook
    const updateChart1 = () => {
      if (chart1Instance.current) {
        chart1Instance.current.destroy();
      }
      const ctx = chart1Ref.current.getContext('2d');
      chart1Instance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Pre-APU Cost', 'Post-APU Cost'],
          datasets: [{
            label: 'Cost',
            data: [results.preApuCostTotal, results.postApuCostTotal],
            backgroundColor: [colors.negative, colors.positive],
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Annual Idling Cost Comparison', font: { size: 15, family: 'Inter' }, color: 'white' },
          },
          scales: {
            y: { beginAtZero: true, grid: { display: false, color: '#4a5568' }, ticks: { color: 'white', font: { family: 'Inter' } } },
            x: { grid: { display: false }, ticks: { color: 'white', font: { family: 'Inter' } } },
          },
        },
      });
    };

    const updateChart2 = () => {
      if (chart2Instance.current) {
        chart2Instance.current.destroy();
      }
      const ctx = chart2Ref.current.getContext('2d');
      chart2Instance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: results.cumulativeSavings.map(s => s.year),
          datasets: [{
            label: 'Cumulative Net Savings',
            data: results.cumulativeSavings.map(s => s.savings),
            borderColor: colors.positive,
            backgroundColor: 'rgba(53, 206, 141, 0.2)',
            fill: true,
            tension: 0.4,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Cumulative Net Savings Over APU Life', font: { size: 15, family: 'Inter' }, color: 'white' },
          },
          scales: {
            y: { beginAtZero: true, grid: { display: false, color: '#4a5568' }, ticks: { color: 'white', font: { family: 'Inter' } } },
            x: { grid: { display: false }, ticks: { color: 'white', font: { family: 'Inter' } } },
          },
        },
      });
    };

    const updateChart3 = () => {
      if (chart3Instance.current) {
        chart3Instance.current.destroy();
      }
      const ctx = chart3Ref.current.getContext('2d');
      chart3Instance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Annual Fuel Savings', 'Annual Maintenance'],
          datasets: [{
            label: 'Cost',
            data: [results.annualFuelSavingsTotal, results.annualMaintenanceCostTotal],
            backgroundColor: [colors.positive, colors.negative],
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Annual Cost-Benefit Breakdown', font: { size: 15, family: 'Inter' }, color: 'white' },
          },
          scales: {
            y: { beginAtZero: true, grid: { display: false }, ticks: { color: 'white', font: { family: 'Inter' } } },
            x: { beginAtZero: true, grid: { display: false, color: '#4a5568' }, ticks: { color: 'white', font: { family: 'Inter' } } },
          },
        },
      });
    };

    if (results) {
      updateChart1();
      updateChart2();
      updateChart3();
    }
  }, [results]);

  useEffect(() => {
    const updateHeight = () => {
      if (rightPanelRef.current) {
        setLeftPanelHeight(rightPanelRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [results]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleReset = () => {
    setInputs(defaultInputs);
  };

  const calculateSavings = (data) => {
    const { fleetSize, idleTime, fuelPrice, apuInstallationCost, apuMaintenanceCost, apuUsefulLife, operatingDaysPerYear } = data;

    const fuelBurnRate = 0.8; // Hardcoded main engine fuel consumption
    const apuFuelBurnRate = 0.2; // Hardcoded APU fuel consumption
    const apuTime = idleTime * 0.8; // APU runs for 80% of the time, not half

    // Per Truck calculations
    const preApuCostPerTruck = idleTime * fuelBurnRate * fuelPrice * operatingDaysPerYear;
    const postApuCostPerTruck = apuTime * apuFuelBurnRate * fuelPrice * operatingDaysPerYear;

    // Total fleet calculations
    const preApuCostTotal = preApuCostPerTruck * fleetSize;
    const postApuCostTotal = postApuCostPerTruck * fleetSize;
    
    // Annual Fuel Savings (Total Fleet)
    const annualFuelSavingsTotal = preApuCostTotal - postApuCostTotal;
    
    // Annualized APU Cost (Maintenance only)
    const annualMaintenanceCostTotal = apuMaintenanceCost * fleetSize;

    // Total Initial Capital Cost
    const totalInitialCapitalCost = apuInstallationCost * fleetSize;
    
    // Net Annual Savings (Total Fleet)
    const netAnnualSavings = annualFuelSavingsTotal - annualMaintenanceCostTotal;

    // Payback Period
    const paybackYears = netAnnualSavings > 0 ? totalInitialCapitalCost / netAnnualSavings : 0;
    const paybackMonths = Math.round(paybackYears * 12);
    
    // The previous TCO calculation was incorrect. I've updated it to be more accurate.
    const totalApuLifeSavings = (preApuCostPerTruck * apuUsefulLife * fleetSize) - (postApuCostPerTruck * apuUsefulLife * fleetSize);
    const totalNetBenefitOverLife = totalApuLifeSavings - (apuInstallationCost * fleetSize) - (apuMaintenanceCost * fleetSize * apuUsefulLife);
    

    // Cumulative Savings over APU life
    const cumulativeSavings = [];
    let cumulativeNetSavings = 0;
    for (let i = 1; i <= apuUsefulLife; i++) {
        cumulativeNetSavings += netAnnualSavings;
        cumulativeSavings.push({ year: `Year ${i}`, savings: cumulativeNetSavings });
    }

    // This calculation is for the Annual Cost-Benefit Breakdown chart
    const annualizedApuCostPerYear = (totalInitialCapitalCost / apuUsefulLife) + annualMaintenanceCostTotal;

    return {
      preApuCostPerTruck,
      preApuCostTotal,
      postApuCostPerTruck,
      postApuCostTotal,
      annualFuelSavingsTotal,
      annualMaintenanceCostTotal: annualMaintenanceCostTotal,
      netAnnualSavings,
      paybackYears,
      paybackMonths,
      cumulativeSavings,
      totalInitialCapitalCost,
      totalNetBenefit: totalNetBenefitOverLife,
      annualizedApuCostPerYear
    };
  };

  if (!results) return null;

  const createSummaryParagraph = (numTrucks, netAnnualSavings, apuInstallationCost, paybackMonths) => {
    const totalPurchasePrice = apuInstallationCost * numTrucks;
    let savingsText = `By adopting APUs across <span class="font-bold">${numTrucks} trucks</span>, you could achieve net annual fuel cost savings of <span class="font-bold">$${Math.round(netAnnualSavings).toLocaleString('en-US')}</span>.`;
    
    let paybackText;
    if (paybackMonths < 1) {
        paybackText = `The initial investment of <span class="font-bold">$${Math.round(totalPurchasePrice).toLocaleString('en-US')}</span> has a very quick payback period of less than <span class="font-bold">one month</span>.`;
    } else {
        const years = Math.floor(paybackMonths / 12);
        const months = paybackMonths % 12;
        let paybackString = '';
        if (years > 0) paybackString += `${years} year${years > 1 ? 's' : ''}`;
        if (months > 0) paybackString += `${years > 0 ? ' and ' : ''}${months} month${months > 1 ? 's' : ''}`;
        
        paybackText = `The initial investment of <span class="font-bold">$${Math.round(totalPurchasePrice).toLocaleString('en-US')}</span> has a projected payback period of approximately <span class="font-bold">${paybackString}</span>.`;
    }

    if (netAnnualSavings <= 0) {
        paybackText = `The initial investment of <span class="font-bold">$${Math.round(totalPurchasePrice).toLocaleString('en-US')}</span> is not financially viable at this time.`;
    }
    
    return `${savingsText} ${paybackText}`;
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white">APU Fleet Calculator Dashboard</h1>
        <p className="text-gray-400 mt-2">Evaluate fuel cost savings from installing Auxiliary Power Units (APUs)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
        <SummaryCard 
          title="PRE-APU ANNUAL COST" 
          value={`$${Math.round(results.preApuCostPerTruck).toLocaleString()}`} 
          subtitle1="Per Truck" 
          subtitle2={`$${Math.round(results.preApuCostTotal).toLocaleString()} Fleet Total`} 
          valueColor={colors.negative}
          boldSubtitle2={true}
        />
        <SummaryCard 
          title="POST-APU ANNUAL COST" 
          value={`$${Math.round(results.postApuCostPerTruck).toLocaleString()}`} 
          subtitle1="Per Truck" 
          subtitle2={`$${Math.round(results.postApuCostTotal).toLocaleString()} Fleet Total`} 
          valueColor={colors.positive}
          boldSubtitle2={true}
        />
        <SummaryCard 
          title="ANNUAL FUEL SAVINGS" 
          value={`$${Math.round(results.annualFuelSavingsTotal).toLocaleString()}`} 
          subtitle1="Total Fleet" 
          valueColor={colors.positive}
        />
        <SummaryCard 
          title="NET ANNUAL SAVINGS" 
          value={`$${Math.round(results.netAnnualSavings).toLocaleString()}`} 
          subtitle1="After Maintenance" 
          valueColor={colors.positive}
        />
        <SummaryCard 
          title="PAYBACK PERIOD" 
          value={results.paybackYears.toFixed(1)} 
          subtitle1="Years" 
          valueColor={colors.positive}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Fleet Parameters */}
        <div ref={leftPanelRef} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col justify-between" style={{ height: leftPanelHeight }}>
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Fleet Parameters</h2>
            <div className="space-y-4">
              <InputGroup label="Fleet Size (# of trucks)" name="fleetSize" type="number" value={inputs.fleetSize} onChange={handleInputChange} />
              <InputGroup label="Idle Time (hours/day)" name="idleTime" type="number" value={inputs.idleTime} onChange={handleInputChange} />
              <InputGroup label="Fuel Price ($/gallon)" name="fuelPrice" type="number" value={inputs.fuelPrice} onChange={handleInputChange} />
              <InputGroup label="APU Installation Cost ($/truck)" name="apuInstallationCost" type="number" value={inputs.apuInstallationCost} onChange={handleInputChange} />
              <InputGroup label="Annual APU Maintenance Cost ($/truck)" name="apuMaintenanceCost" type="number" value={inputs.apuMaintenanceCost} onChange={handleInputChange} />
              <InputGroup label="APU Useful Life (years)" name="apuUsefulLife" type="number" value={inputs.apuUsefulLife} onChange={handleInputChange} />
              <InputGroup label="Operating Days Per Year" name="operatingDaysPerYear" type="number" value={inputs.operatingDaysPerYear} onChange={handleInputChange} />
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl mt-6 border border-gray-700">
            <h3 className="text-md font-semibold text-white mb-6 text-center">Assumptions Used</h3>
            <div className="space-y-6">
                <div className="flex justify-between items-center text-sm text-gray-400">
                    <span className="text-left">Idling Fuel Consumption<br/>(Main Engine):</span>
                    <span className="text-right">0.8 gallons<br/>per hour</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-400">
                    <span className="text-left">Idling Fuel Consumption<br/>(APU):</span>
                    <span className="text-right">0.2 gallons<br/>per hour</span>
                </div>
            </div>
            <p className="mt-6 text-[13px] text-gray-400 italic text-center">These values are based on commonly accepted industry averages and can be adjusted for a more precise analysis.</p>
          </div>
          <button onClick={handleReset} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md shadow-lg hover:bg-blue-700 transition duration-200 mt-6">
            Reset to Defaults
          </button>
        </div>

        {/* Right Column - Charts and Visuals */}
        <div ref={rightPanelRef} className="lg:col-span-2 space-y-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <canvas ref={chart1Ref} id="chart1"></canvas>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <canvas ref={chart2Ref} id="chart2"></canvas>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <canvas ref={chart3Ref} id="chart3"></canvas>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-10 p-6 rounded-xl border border-gray-700 bg-[var(--color-secondary)]">
        <h3 className="text-xl font-bold text-white mb-4">Fuel Cost Savings Summary</h3>
        <p className="text-white leading-relaxed" dangerouslySetInnerHTML={{__html: createSummaryParagraph(
            inputs.fleetSize,
            results.netAnnualSavings,
            inputs.apuInstallationCost,
            results.paybackMonths
          )}}></p>
      </div>
    </div>
  );
}

const SummaryCard = ({ title, value, subtitle1, subtitle2, valueColor, boldSubtitle2 }) => (
  <div className="bg-gray-800 p-4 rounded-xl shadow-md text-center border border-gray-700 flex-1 flex flex-col justify-between">
    <div className="flex-grow flex flex-col justify-center space-y-2">
      <p className="text-gray-400 text-xs font-bold leading-none">{title}</p>
      <p className="text-2xl font-bold leading-none" style={{ color: valueColor }}>{value}</p>
      {subtitle1 && <p className="text-gray-400 text-xs leading-none">{subtitle1}</p>}
    </div>
    {subtitle2 && (
      <p className={`text-gray-400 text-xs mt-2 leading-none`}>
        {boldSubtitle2 ? <span className="font-bold">{subtitle2.split(' ')[0]}</span> : subtitle2}
        {boldSubtitle2 && ` ${subtitle2.split(' ').slice(1).join(' ')}`}
      </p>
    )}
  </div>
);

const InputGroup = ({ label, name, type, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm sm:text-sm p-2.5"
      style={{ fontFamily: 'Inter, sans-serif' }}
    />
  </div>
);

export default App;