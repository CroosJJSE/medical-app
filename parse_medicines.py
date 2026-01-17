#!/usr/bin/env python3
"""
Script to parse medicines.txt and convert it to a structured CSV file.
"""

import csv
import re

def parse_medicines_file(input_file, output_file):
    """Parse medicines.txt and create a structured CSV."""
    
    csv_rows = []
    current_category = None
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()  # Only strip right side to preserve leading spaces
        
        # Skip empty lines
        if not line.strip():
            i += 1
            continue
        
        # Skip header line
        if 'Common formulary' in line:
            i += 1
            continue
        
        # Check if this is a category header
        # Categories typically don't start with a number
        if not re.match(r'^\s*\d+\.', line) and not line.startswith('   '):
            # Check if it's a known category pattern
            if any(keyword in line for keyword in [
                'Drugs used in', 'Drugs affecting', 'Drugs acting on',
                'Immunological', 'Antidotes', 'Narcotics'
            ]):
                current_category = line.strip()
                i += 1
                continue
        
        # Check if this is a drug entry (starts with a number and period, not indented)
        drug_match = re.match(r'^(\d+)\.\s+(.+)$', line)
        
        if drug_match:
            drug_name = drug_match.group(2).strip()
            
            # Look ahead to see if there are indented sub-formulations
            i += 1
            has_sub_formulations = False
            
            # Collect sub-formulations
            sub_formulations = []
            while i < len(lines):
                next_line = lines[i].rstrip()
                
                # Check if it's an indented sub-formulation (starts with spaces and a number)
                if re.match(r'^\s+\d+\.\s+(.+)$', next_line):
                    sub_match = re.match(r'^\s+\d+\.\s+(.+)$', next_line)
                    sub_formulations.append(sub_match.group(1).strip())
                    has_sub_formulations = True
                    i += 1
                elif next_line.strip() and not re.match(r'^\s*\d+\.', next_line) and not next_line.startswith('   '):
                    # Next non-empty line is not indented and not a sub-formulation
                    break
                elif not next_line.strip():
                    # Empty line
                    i += 1
                    if i < len(lines) and lines[i].strip() and not re.match(r'^\s+\d+\.', lines[i]):
                        # Next non-empty line is not indented
                        break
                    continue
                else:
                    break
            
            if has_sub_formulations and sub_formulations:
                # Add each sub-formulation as a separate row
                for sub_form in sub_formulations:
                    csv_rows.append({
                        'category': current_category or '',
                        'drug_name': drug_name,
                        'formulation': sub_form
                    })
            else:
                # No sub-formulations - check if drug_name contains formulation info
                # Try to split drug name from formulation
                # Common pattern: "DrugName Formulation Details"
                
                # Special cases first: "Drug Name for Injection/Infusion Xmg"
                special_match = re.search(r'^(.+?)\s+(for\s+(?:Injection|Infusion))\s+(.+)$', drug_name, re.IGNORECASE)
                if special_match:
                    actual_drug_name = special_match.group(1).strip()
                    formulation = f"{special_match.group(2)} {special_match.group(3)}".strip()
                    csv_rows.append({
                        'category': current_category or '',
                        'drug_name': actual_drug_name,
                        'formulation': formulation
                    })
                else:
                    # Check for common formulation keywords (not including "for" alone)
                    formulation_match = re.search(
                        r'\s+(Tablet|Capsule|Injection|Oral|Suppository|Syrup|Ointment|Cream|Gel|Drops|Spray|Inhaler|Implant|Patches|Vial|Ampoule|Solution|Suspension|Powder|Sachet|Bottle|Crystal|Crystals|Infusion|Pessaries|Pessary|Nasal|Eye|Ear|Mouth|Vaginal|Subdermal|Intrauterine|Chewable|Modified|Extended|Controlled|Dry|Pressurized|Respiratory|Topical|Transdermal|Self|Aerosol|Hydrochloride|Sulphate|Sodium|Acetate|Mesylate|Tartrate|Fumarate|Citrate|Phosphate|Malate|Xinafoate|Propionate|Valerate|Dipropionate|Bromide|Maleate|Decanoate|Enanthate|Undecanoate|Tromethamine|Tromethamine|Succinate|Implant)(\s+.+)?$',
                        drug_name,
                        re.IGNORECASE
                    )
                    
                    if formulation_match:
                        # Split drug name from formulation
                        split_pos = formulation_match.start()
                        actual_drug_name = drug_name[:split_pos].strip()
                        formulation = drug_name[split_pos:].strip()
                        csv_rows.append({
                            'category': current_category or '',
                            'drug_name': actual_drug_name,
                            'formulation': formulation
                        })
                    else:
                        # Whole thing is drug name, no formulation
                        csv_rows.append({
                            'category': current_category or '',
                            'drug_name': drug_name,
                            'formulation': ''
                        })
        else:
            i += 1
    
    # Write to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if csv_rows:
            fieldnames = ['category', 'drug_name', 'formulation']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(csv_rows)
    
    print(f"Successfully parsed {len(csv_rows)} medicine entries")
    print(f"CSV saved to: {output_file}")
    return csv_rows

if __name__ == '__main__':
    parse_medicines_file('medicines.txt', 'medicines.csv')
