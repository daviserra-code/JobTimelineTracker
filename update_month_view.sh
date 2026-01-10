#!/bin/bash

# Define the pattern to find
PATTERN='onMouseEnter={\(e\) => handleActivityMouseEnter\(e, activity\)}
                        onMouseLeave={handleActivityMouseLeave}
                        onClick={\(\) => onActivityClick && onActivityClick\(activity\)}'

# Define the replacement
REPLACEMENT='onMouseEnter={(e) => handleActivityMouseEnter(e, activity)}
                        onMouseLeave={handleActivityMouseLeave}
                        onClick={() => onActivityClick && onActivityClick(activity)}
                        onContextMenu={(e) => onActivityContextMenu && onActivityContextMenu(e, activity)}
                        title={`${activity.title} (Right-click to delete)`}'

# Perform the substitution and save to a temporary file
sed "s/$PATTERN/$REPLACEMENT/g" client/src/components/month-view.tsx > temp_file.txt

# Move the temporary file to the original file
mv temp_file.txt client/src/components/month-view.tsx
