import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import scooterIcon from "../assets/scooter.png";

/**
 * DeliveryPartnerMap
 * Props:
 *   orders: array of order objects with driverPositions and orderStatus
 *   center: [lat, lng] (default: Nagpur)
 *   zoom: number (default: 12)
 *   style: object (default: { height: 280, width: "100%", borderRadius: 8 })
 */
const DeliveryPartnerMap = ({ orders = [], center = [21.146633, 79.079637], zoom = 12, style = { height: 280, width: "100%", borderRadius: 8 } }) => {
  // Filter orders for valid driverPositions and status not preparing/prepared
  const includedOrders = orders.filter(order => {
    const pos = order.driverPositions;
    let lat = null, lng = null;
    if (pos && typeof pos === "object") {
      if (typeof pos.latitude === "number" && typeof pos.longitude === "number") {
        lat = pos.latitude;
        lng = pos.longitude;
      } else if (typeof pos._latitude === "number" && typeof pos._longitude === "number") {
        lat = pos._latitude;
        lng = pos._longitude;
      }
    }
    const status = order.orderStatus;
    const exclude = status === "preparing" || status === "prepared";
    return lat !== null && lng !== null && !exclude;
  });

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={style}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {includedOrders.map(order => {
        const pos = order.driverPositions;
        let lat = null, lng = null;
        if (pos && typeof pos === "object") {
          if (typeof pos.latitude === "number" && typeof pos.longitude === "number") {
            lat = pos.latitude;
            lng = pos.longitude;
          } else if (typeof pos._latitude === "number" && typeof pos._longitude === "number") {
            lat = pos._latitude;
            lng = pos._longitude;
          }
        }
        return (
          <Marker
            key={order.id}
            position={[lat, lng]}
            icon={new L.Icon({
              iconUrl: scooterIcon,
              iconSize: [64, 64],
              iconAnchor: [32, 64],
              popupAnchor: [0, -64]
            })}
          >
            <Popup>
              <strong>Delivery Partner</strong><br />
              Order: {order.orderId || order.id}<br />
              {order.partnerAssigned?.name || order.partnerAssigned?.partnerName || "Unknown"}<br />
              <span>Lat: {lat?.toFixed(5)}, Lng: {lng?.toFixed(5)}</span>
              <br />Status: {order.orderStatus}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default DeliveryPartnerMap;
