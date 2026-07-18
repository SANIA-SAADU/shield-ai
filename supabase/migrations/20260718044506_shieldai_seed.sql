/*
# ShieldAI Seed Data

Populates fraud_network and crime_hotspots with realistic Indian
public-safety demo data so the graph and heatmap render with content on
first load. Idempotent: deletes existing seed rows first.

## fraud_network nodes
- victim_1       victim  (a retired teacher in Hyderabad)
- phone_1, phone_2   phone numbers used by the network
- bank_1, bank_2     mule bank accounts
- device_1, device_2 devices used
- complaint_1, complaint_2  prior complaints linked to the same numbers

## crime_hotspots
- Hyderabad, Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Jaipur, Lucknow
  with intensity, scam_type, cases, trend
*/

DELETE FROM fraud_network;

INSERT INTO fraud_network (node_id, node_type, label, risk, links, meta) VALUES
('victim_1', 'victim', 'R. Sharma (Victim)', 78, ARRAY['phone_1','bank_1'], '{"location":"Hyderabad","age":64,"loss_prevented":120000}'),
('victim_2', 'victim', 'K. Rao (Victim)', 65, ARRAY['phone_2'], '{"location":"Delhi","age":41,"loss_prevented":45000}'),
('phone_1', 'phone', '+91-98XXX-41205', 92, ARRAY['bank_1','device_1','complaint_1'], '{"carrier":"spoofed","registered":"unknown"}'),
('phone_2', 'phone', '+91-70XXX-88110', 88, ARRAY['bank_2','device_2','complaint_2'], '{"carrier":"voip","registered":"Bihar"}'),
('bank_1', 'bank', 'HDFC •••• 4421 (mule)', 84, ARRAY['device_1'], '{"bank":"HDFC","ifsc":"HDFC0001234","frozen":true}'),
('bank_2', 'bank', 'SBI •••• 7788 (mule)', 79, ARRAY['device_2'], '{"bank":"SBI","ifsc":"SBIN0004455","frozen":false}'),
('device_1', 'device', 'Device IMEI 35•••12', 71, ARRAY['complaint_1'], '{"os":"Android","first_seen":"2025-06-01"}'),
('device_2', 'device', 'Device IMEI 86•••90', 68, ARRAY['complaint_2'], '{"os":"Android","first_seen":"2025-06-14"}'),
('complaint_1', 'complaint', 'NC-2025-0841', 60, ARRAY['phone_1'], '{"status":"open","agency":"Cyber Crime","date":"2025-06-03"}'),
('complaint_2', 'complaint', 'NC-2025-0917', 55, ARRAY['phone_2'], '{"status":"open","agency":"Cyber Crime","date":"2025-06-15"}');

DELETE FROM crime_hotspots;

INSERT INTO crime_hotspots (city, state, lat, lng, intensity, scam_type, cases, trend) VALUES
('Hyderabad','Telangana',17.3850,78.4867,9,'digital_arrest',1240,'rising'),
('Delhi','Delhi',28.6139,77.2090,10,'digital_arrest',2156,'rising'),
('Mumbai','Maharashtra',19.0760,72.8774,7,'investment',980,'rising'),
('Kolkata','West Bengal',22.5726,88.3639,6,'phishing',720,'stable'),
('Chennai','Tamil Nadu',13.0827,80.2707,7,'digital_arrest',890,'rising'),
('Bengaluru','Karnataka',12.9716,77.5946,8,'investment',1320,'rising'),
('Jaipur','Rajasthan',26.9124,75.7873,5,'fake_currency',430,'stable'),
('Lucknow','Uttar Pradesh',26.8467,80.9462,6,'phishing',610,'declining'),
('Pune','Maharashtra',18.5204,73.8567,6,'digital_arrest',540,'rising'),
('Ahmedabad','Gujarat',23.0225,72.5714,5,'fake_currency',380,'stable');
