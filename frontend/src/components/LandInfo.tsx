import React from 'react';

export interface LandDetailsProps {
  numberOfPlots: number;
  titleNumber: string;
  state: string;
  lga: string;
  city: string;
  pricePerPlot: number;
  isVerified: string;
  forSale: string;
}

const LandInfo: React.FC<LandDetailsProps> = ({
  numberOfPlots,
  titleNumber,
  state,
  lga,
  city,
  pricePerPlot,
  isVerified,
  forSale,
}) => {
  return (
    <div className="w-full bg-white rounded-lg overflow-hidden shadow-lg mb-6">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Land Information
        </h3>

        <div className="space-y-3">
          <InfoRow label="Number of Plots" value={numberOfPlots || 0} />
          <InfoRow label="Title Number" value={titleNumber || 'N/A'} />
          <InfoRow label="State" value={state || 'N/A'} />
          <InfoRow label="LGA" value={lga || 'N/A'} />
          <InfoRow label="City" value={city || 'N/A'} />
          <InfoRow
            label="Price Per Plot"
            value={pricePerPlot ? `${pricePerPlot} ETH` : 'N/A'}
          />
          <InfoRow
            label="Verified"
            value={isVerified === 'true' ? 'Yes' : 'No'}
          />
          <InfoRow
            label="For Sale"
            value={forSale === 'true' ? 'Yes' : 'No'}
          />
        </div>
      </div>
    </div>
  );
};

interface InfoRowProps {
  label: string;
  value: string | number;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div className="flex">
    <div className="w-1/2 text-gray-600">{label}:</div>
    <div className="w-1/2 text-gray-800">{value}</div>
  </div>
);

export default LandInfo;
